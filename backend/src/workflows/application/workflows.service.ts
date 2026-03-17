import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../domain/workflow.entity';
import { WorkflowVersion } from '../domain/workflow-version.entity';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
    @InjectRepository(WorkflowVersion)
    private workflowVersionsRepository: Repository<WorkflowVersion>,
  ) {}

  async createWorkflow(niche: string, name: string): Promise<Workflow> {
    const workflow = this.workflowsRepository.create({ niche, name });
    const savedWorkflow = await this.workflowsRepository.save(workflow);

    // Create initial draft version
    const version = this.workflowVersionsRepository.create({
      workflowId: savedWorkflow.id,
      versionNumber: 1,
      nodes: [],
      settings: {},
      status: 'draft',
    });
    await this.workflowVersionsRepository.save(version);

    return savedWorkflow;
  }

  async getLatestByNiche(
    niche: string,
  ): Promise<{ workflow: Workflow; version: WorkflowVersion | null }> {
    const workflow = await this.workflowsRepository.findOne({
      where: { niche },
      order: { createdAt: 'DESC' },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow for niche ${niche} not found`);
    }

    // Get latest version (highest version number)
    const version = await this.workflowVersionsRepository.findOne({
      where: { workflowId: workflow.id },
      order: { versionNumber: 'DESC' },
    });

    return { workflow, version };
  }

  async getById(
    workflowId: string,
  ): Promise<{ workflow: Workflow; version: WorkflowVersion | null }> {
    const workflow = await this.workflowsRepository.findOne({
      where: { id: workflowId },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    // Get latest version (highest version number)
    const version = await this.workflowVersionsRepository.findOne({
      where: { workflowId: workflow.id },
      order: { versionNumber: 'DESC' },
    });

    return { workflow, version };
  }

  async saveDraft(
    workflowId: string,
    data: { nodes: Record<string, unknown>[]; settings: Record<string, unknown> },
  ) {
    // 1. Check if latest version is draft
    let version = await this.workflowVersionsRepository.findOne({
      where: { workflowId },
      order: { createdAt: 'DESC' },
    });

    if (!version || version.status !== 'draft') {
      // Create new draft version
      const nextVersionNumber = version ? version.versionNumber + 1 : 1;
      version = this.workflowVersionsRepository.create({
        workflowId,
        versionNumber: nextVersionNumber,
        status: 'draft',
      });
    }

    // Update draft
    version.nodes = data.nodes;
    version.settings = data.settings;
    return this.workflowVersionsRepository.save(version);
  }

  async publishVersion(workflowId: string): Promise<Workflow> {
    const latestVersion = await this.workflowVersionsRepository.findOne({
      where: { workflowId },
      order: { versionNumber: 'DESC' },
    });

    if (!latestVersion) {
      throw new NotFoundException('No version to publish');
    }

    // Update version status
    latestVersion.status = 'published';
    await this.workflowVersionsRepository.save(latestVersion);

    // Update workflow active pointer
    const workflow = await this.workflowsRepository.findOne({ where: { id: workflowId } });
    if (workflow) {
      workflow.activeVersionId = latestVersion.id;
      return this.workflowsRepository.save(workflow);
    }

    throw new NotFoundException('Workflow not found');
  }
  async createFromTemplate(niche: string, templateId: string): Promise<Workflow> {
    const templatePath = path.join(
      process.cwd(),
      'src/workflows/infrastructure/templates',
      `${templateId}.json`,
    );

    let templateNodes = [];
    try {
      const fileContent = await fs.readFile(templatePath, 'utf-8');
      templateNodes = JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error reading template ${templateId}:`, error);
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // Create a new workflow (reuses existing logic which creates an empty draft)
    const workflow = await this.createWorkflow(niche, 'My Medical Agent');

    // Update the draft with template nodes
    const draftVersion = await this.workflowVersionsRepository.findOne({
      where: { workflowId: workflow.id, status: 'draft' },
    });

    if (draftVersion) {
      console.log(
        `[DEBUG] Found draft version ${draftVersion.id}, updating with ${templateNodes.length} nodes from ${templateId}`,
      );
      if (templateNodes.length > 0) {
        draftVersion.nodes = templateNodes;
        await this.workflowVersionsRepository.save(draftVersion);
        console.log(
          `[DEBUG] Draft version updated successfully. Nodes count: ${draftVersion.nodes.length}`,
        );

        // Return explicit confirmation if needed, but the method returns Promise<Workflow>
        // converting to any to attach data might be hacky but useful for debug
        return { ...workflow, nodes: templateNodes } as any;
      } else {
        console.log(`[DEBUG] Template nodes array is empty! Check JSON file content.`);
      }
    } else {
      console.log(`[DEBUG] Draft version NOT found for workflow ${workflow.id}`);
    }

    return workflow;
  }
}

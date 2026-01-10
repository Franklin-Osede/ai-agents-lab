import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../domain/workflow.entity';
import { WorkflowVersion } from '../domain/workflow-version.entity';

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
    const workflow = await this.workflowsRepository.findOne({ where: { niche } });
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
}

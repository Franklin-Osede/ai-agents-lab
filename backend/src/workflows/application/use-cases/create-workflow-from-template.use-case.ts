import { Injectable, Inject } from '@nestjs/common';
import { TemplateCustomization } from '../../domain/entities/workflow-template.entity';
import { IWorkflowTemplateRepository } from './get-templates-by-niche.use-case';
import { WorkflowsService } from '../workflows.service';

export interface CreateWorkflowFromTemplateDto {
  templateId: string;
  tenantId: string;
  customization: TemplateCustomization;
}

@Injectable()
export class CreateWorkflowFromTemplateUseCase {
  constructor(
    @Inject('IWorkflowTemplateRepository')
    private readonly templateRepository: IWorkflowTemplateRepository,
    private readonly workflowsService: WorkflowsService,
  ) {}

  async execute(dto: CreateWorkflowFromTemplateDto) {
    // 1. Load template
    const template = await this.templateRepository.findById(dto.templateId);
    if (!template) {
      throw new Error(`Template ${dto.templateId} not found`);
    }

    // 2. Validate template
    const validation = template.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    // 3. Customize template
    const customized = template.customize(dto.customization);

    // 4. Create workflow from customized nodes
    const workflow = await this.workflowsService.createWorkflow(
      dto.tenantId,
      `Workflow from ${template.name}`,
    );

    // 5. Save customized nodes as first version
    const version = await this.workflowsService.saveDraft(workflow.id, {
      nodes: customized.nodes as any,
      settings: {
        voiceGender: 'female',
        voiceName: dto.customization.voiceId || 'Lucia',
        agentName: dto.customization.agentName || 'Asistente Virtual',
        tone: 'professional',
        language: 'es',
        primaryColor: dto.customization.primaryColor || '#6c2bee',
      } as any,
    });

    return {
      workflow,
      version,
      nodes: customized.nodes,
    };
  }
}

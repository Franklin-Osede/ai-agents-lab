import { Injectable, Inject } from '@nestjs/common';
import { WorkflowTemplate } from '../../domain/entities/workflow-template.entity';
import { NicheType } from '../../domain/value-objects/template-niche.vo';

export interface IWorkflowTemplateRepository {
  findByNiche(nicheType: NicheType): Promise<WorkflowTemplate[]>;
  findById(id: string): Promise<WorkflowTemplate | null>;
  save(template: WorkflowTemplate): Promise<WorkflowTemplate>;
}

@Injectable()
export class GetTemplatesByNicheUseCase {
  constructor(
    @Inject('IWorkflowTemplateRepository')
    private readonly templateRepository: IWorkflowTemplateRepository,
  ) {}

  async execute(nicheType: NicheType): Promise<WorkflowTemplate[]> {
    const templates = await this.templateRepository.findByNiche(nicheType);

    // Sort by popularity (public templates first, then by creation date)
    return templates.sort((a, b) => {
      if (a.isPublic && !b.isPublic) return -1;
      if (!a.isPublic && b.isPublic) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
}

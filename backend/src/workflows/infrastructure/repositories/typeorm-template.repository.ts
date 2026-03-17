import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowTemplate } from '../../domain/entities/workflow-template.entity';
import { NicheType } from '../../domain/value-objects/template-niche.vo';
import { IWorkflowTemplateRepository } from '../../application/use-cases/get-templates-by-niche.use-case';

@Injectable()
export class TypeOrmTemplateRepository implements IWorkflowTemplateRepository {
  constructor(
    @InjectRepository(WorkflowTemplate)
    private readonly repository: Repository<WorkflowTemplate>,
  ) {}

  async findByNiche(nicheType: NicheType): Promise<WorkflowTemplate[]> {
    return this.repository.find({
      where: { nicheType },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<WorkflowTemplate | null> {
    return this.repository.findOne({ where: { id } });
  }

  async save(template: WorkflowTemplate): Promise<WorkflowTemplate> {
    return this.repository.save(template);
  }

  async findAll(): Promise<WorkflowTemplate[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }
}

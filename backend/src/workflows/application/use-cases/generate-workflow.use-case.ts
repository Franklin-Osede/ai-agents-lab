import { Injectable } from '@nestjs/common';
import { GenerateWorkflowDto } from '../../interfaces/http/dtos/generate-workflow.dto';
import { WorkflowGeneratorService } from '../services/workflow-generator.service';

@Injectable()
export class GenerateWorkflowUseCase {
  constructor(private readonly generatorService: WorkflowGeneratorService) {}

  async execute(dto: GenerateWorkflowDto): Promise<any> {
    return this.generatorService.generate(dto.sourceId, dto.niche);
  }
}

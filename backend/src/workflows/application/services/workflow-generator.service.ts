import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowTemplate } from '../../domain/entities/workflow-template.entity';
import { IKnowledgeSourceRepository } from '../../../knowledge/domain/repositories/knowledge-source.repository';
import { WorkflowVersion } from '../../domain/workflow-version.entity';

@Injectable()
export class WorkflowGeneratorService {
  private readonly logger = new Logger(WorkflowGeneratorService.name);

  constructor(
    @InjectRepository(WorkflowTemplate)
    private readonly templateRepository: Repository<WorkflowTemplate>,
    private readonly knowledgeRepository: IKnowledgeSourceRepository,
  ) {}

  async generate(sourceId: string, niche: string): Promise<any> {
    this.logger.log(`Generating workflow for source ${sourceId} in niche ${niche}`);

    // 1. Get Knowledge
    const knowledge = await this.knowledgeRepository.findById(sourceId);
    if (!knowledge) {
      throw new NotFoundException(`Knowledge Source ${sourceId} not found`);
    }

    // 2. Get Template (Simplification: using niche directly as template ID or lookup)
    // In a real scenario, we might query by niche column.
    // For now, let's assume we fetch *any* template for this niche or a specific one.
    // Temporary Hack: Just fetch the first template for now as we might not have niche column indexed or populated.
    // TODO: Implement proper template selection strategy
    const templates = await this.templateRepository.find();
    const template = templates.find((t) => (t.niche as any)?.value === niche) || templates[0];

    if (!template) {
      throw new NotFoundException(`No template found for niche ${niche}`);
    }

    // 3. Hydrate Template (The AI Magic - Mocked for now to ensure flow works first)
    // In Phase 1.5, we will call Bedrock/OpenAI here.
    const nodes = this.hydrateNodes(template.nodes, knowledge);

    return {
      templateId: template.id,
      nodes,
      niche,
      sourceId,
    };
  }

  private hydrateNodes(nodes: any[], knowledge: any): any[] {
    // Simple hydration strategy: Replace placeholders or inject context
    // This is where we will hook up the LLM later.
    return nodes.map((node) => {
      const newNode = { ...node };

      // Example: Personalize Greeting
      if (node.type === 'voicenote' && node.data?.text) {
        // Simple string replacement if we had placeholders
        // newNode.data.text = node.data.text.replace('[BUSINESS_NAME]', knowledge.businessName || 'La Clínica');
      }

      return newNode;
    });
  }
}

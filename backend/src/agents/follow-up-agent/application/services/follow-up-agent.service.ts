import { Injectable, Inject } from '@nestjs/common';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import { FollowUpUrgency } from '../../domain/entities/follow-up.entity';
import { IFollowUpRepository } from '../../domain/interfaces/follow-up-repository.interface';

export interface FollowUpRequest {
  customerId: string;
  businessId: string;
  lastInteraction: string;
  daysSinceLastContact: number;
  previousIntent?: string;
  context?: Record<string, any>;
}

export interface FollowUpResponse {
  success: boolean;
  message: string;
  urgency: FollowUpUrgency;
  suggestedNextSteps: string[];
}

@Injectable()
export class FollowUpAgentService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: IAiProvider,
    @Inject('IFollowUpRepository') private readonly followUpRepository?: IFollowUpRepository,
  ) {}

  async generateFollowUp(request: FollowUpRequest): Promise<Result<FollowUpResponse>> {
    try {
      const urgency = this.calculateUrgency(request.daysSinceLastContact);
      const message = await this.generateFollowUpMessage(request, urgency);
      const nextSteps = this.generateNextSteps(request, urgency);

      // Save follow-up if repository is available
      if (this.followUpRepository) {
        const FollowUpEntity = (await import('../../domain/entities/follow-up.entity')).FollowUp;
        const followUp = new FollowUpEntity(
          request.customerId,
          request.businessId,
          request.lastInteraction,
          request.daysSinceLastContact,
          message,
          urgency,
        );
        followUp.previousIntent = request.previousIntent;
        await this.followUpRepository.save(followUp);
      }

      return Result.ok({
        success: true,
        message,
        urgency,
        suggestedNextSteps: nextSteps,
      });
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  private async generateFollowUpMessage(
    request: FollowUpRequest,
    urgency: FollowUpUrgency,
  ): Promise<string> {
    const systemPrompt = `You are a professional follow-up assistant.
Your goal is to re-engage customers who haven't responded, in a friendly and non-pushy way.
Adapt your tone based on urgency: ${urgency}`;

    const userPrompt = `Generate a follow-up message for a customer who:
- Last interaction: "${request.lastInteraction}"
- Days since last contact: ${request.daysSinceLastContact}
- Previous intent: ${request.previousIntent || 'Unknown'}

Create a message that:
1. References the previous conversation naturally
2. Offers value or addresses potential concerns
3. Includes a clear call-to-action
4. Is friendly but not desperate

Keep it to 2-3 sentences max.`;

    return this.aiProvider.generateResponse(userPrompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 200,
    });
  }

  private calculateUrgency(daysSinceLastContact: number): FollowUpUrgency {
    if (daysSinceLastContact <= 1) return FollowUpUrgency.LOW;
    if (daysSinceLastContact <= 3) return FollowUpUrgency.MEDIUM;
    return FollowUpUrgency.HIGH;
  }

  private generateNextSteps(request: FollowUpRequest, urgency: FollowUpUrgency): string[] {
    const baseSteps = ['Send follow-up message', 'Wait for response'];

    if (urgency === FollowUpUrgency.HIGH) {
      return [...baseSteps, 'Offer special discount', 'Schedule callback'];
    }

    if (urgency === FollowUpUrgency.MEDIUM) {
      return [...baseSteps, 'Send additional information', 'Offer consultation'];
    }

    return baseSteps;
  }
}

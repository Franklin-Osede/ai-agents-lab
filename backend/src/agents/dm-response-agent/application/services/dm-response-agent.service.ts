import { Injectable, Inject } from '@nestjs/common';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import {
  AgentIntent,
  IntentType,
} from '../../../../core/domain/agents/entities/agent-intent.entity';
import { IntentClassifierService } from '../../../../shared/services/intent-classifier.service';
import { MessageChannel } from '../../domain/entities/message.entity';
import { IMessageRepository } from '../../domain/interfaces/message-repository.interface';

export interface DmRequest {
  message: string;
  customerId: string;
  businessId: string;
  channel: MessageChannel;
  context?: Record<string, any>;
}

export interface DmResponse {
  success: boolean;
  response: string;
  intent: {
    type: string;
    confidence: number;
  };
  suggestedActions?: string[];
}

@Injectable()
export class DmResponseAgentService {
  constructor(
    private readonly intentClassifier: IntentClassifierService,
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: IAiProvider,
    @Inject('IMessageRepository') private readonly messageRepository?: IMessageRepository,
  ) {}

  async processDm(request: DmRequest): Promise<Result<DmResponse>> {
    try {
      const intent = await this.intentClassifier.classify(request.message);

      const response = await this.generateContextualResponse(
        request.message,
        intent,
        request.channel,
        request.context,
      );

      // Save message if repository is available
      if (this.messageRepository) {
        const message = new (await import('../../domain/entities/message.entity')).Message(
          request.customerId,
          request.businessId,
          request.channel,
          request.message,
        );
        message.markAsSent(response);
        await this.messageRepository.save(message);
      }

      return Result.ok({
        success: true,
        response,
        intent: {
          type: intent.type,
          confidence: intent.confidence,
        },
        suggestedActions: this.getSuggestedActions(intent),
      });
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  private async generateContextualResponse(
    message: string,
    intent: AgentIntent,
    channel: MessageChannel,
    context?: Record<string, any>,
  ): Promise<string> {
    const systemPrompt = `You are a friendly customer service assistant for ${context?.businessName || 'a business'}.
You respond to ${channel} messages in a casual, helpful, and professional manner.
Keep responses concise (1-2 sentences max) and emoji-friendly when appropriate.`;

    const userPrompt = `Customer message: "${message}"
Intent detected: ${intent.type}

Generate a helpful response that addresses their question or request.
If it's a price query, be specific. If it's a booking, offer to help schedule.
Keep it friendly and brief.`;

    return this.aiProvider.generateResponse(userPrompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 150,
    });
  }

  private getSuggestedActions(intent: AgentIntent): string[] {
    const actions: Record<IntentType, string[]> = {
      [IntentType.BOOKING]: ['Schedule appointment', 'Check availability'],
      [IntentType.PRICE_QUERY]: ['View pricing', 'Request quote'],
      [IntentType.INFORMATION]: ['Learn more', 'Contact us'],
      [IntentType.FOLLOW_UP]: ['Continue conversation', 'Provide more info'],
      [IntentType.OBJECTION_HANDLING]: ['Address concerns', 'Offer discount'],
      [IntentType.UNKNOWN]: ['Get help', 'Contact support'],
    };

    return actions[intent.type] || [];
  }
}

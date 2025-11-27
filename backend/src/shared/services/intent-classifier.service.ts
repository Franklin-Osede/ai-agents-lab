import { Injectable, Inject } from '@nestjs/common';
import { AgentIntent, IntentType } from '../../core/domain/agents/entities/agent-intent.entity';
import { IIntentClassifier } from '../../core/domain/agents/interfaces/intent-classifier.interface';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../core/domain/agents/interfaces/ai-provider.interface';

@Injectable()
export class IntentClassifierService implements IIntentClassifier {
  private readonly intentMap: Record<string, IntentType> = {
    BOOKING: IntentType.BOOKING,
    PRICE_QUERY: IntentType.PRICE_QUERY,
    INFORMATION: IntentType.INFORMATION,
    FOLLOW_UP: IntentType.FOLLOW_UP,
    OBJECTION_HANDLING: IntentType.OBJECTION_HANDLING,
  };

  constructor(@Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: IAiProvider) {}

  async classify(message: string): Promise<AgentIntent> {
    const intents = Object.keys(this.intentMap);
    const classification = await this.aiProvider.classifyIntent(message, intents);

    const intentType = this.intentMap[classification.intent] || IntentType.UNKNOWN;

    return new AgentIntent(
      intentType,
      classification.confidence,
      message,
      this.extractEntities(message, intentType),
    );
  }

  private extractEntities(message: string, intent: IntentType): Record<string, any> {
    const entities: Record<string, any> = {};

    if (intent === IntentType.BOOKING) {
      const timePattern = /\b(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?\b/gi;
      const times = message.match(timePattern);
      if (times) {
        entities.times = times;
      }

      const datePattern =
        /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
      const dates = message.match(datePattern);
      if (dates) {
        entities.dates = dates;
      }
    }

    if (intent === IntentType.PRICE_QUERY) {
      const pricePattern = /\b(\d+)\s*(€|euros?|dollars?)\b/gi;
      const prices = message.match(pricePattern);
      if (prices) {
        entities.prices = prices;
      }
    }

    return entities;
  }
}

import { BaseEntity } from '../../shared/entities/base.entity';

export enum IntentType {
  BOOKING = 'BOOKING',
  PRICE_QUERY = 'PRICE_QUERY',
  INFORMATION = 'INFORMATION',
  FOLLOW_UP = 'FOLLOW_UP',
  OBJECTION_HANDLING = 'OBJECTION_HANDLING',
  UNKNOWN = 'UNKNOWN',
}

export class AgentIntent extends BaseEntity {
  type: IntentType;
  confidence: number;
  entities: Record<string, any>;
  originalMessage: string;

  constructor(
    type: IntentType,
    confidence: number,
    originalMessage: string,
    entities: Record<string, any> = {},
  ) {
    super();
    this.type = type;
    this.confidence = confidence;
    this.entities = entities;
    this.originalMessage = originalMessage;
  }

  isHighConfidence(): boolean {
    return this.confidence >= 0.8;
  }
}

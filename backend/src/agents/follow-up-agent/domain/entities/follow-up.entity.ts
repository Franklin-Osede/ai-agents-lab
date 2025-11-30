import { BaseEntity } from '../../../../core/domain/shared/entities/base.entity';

export enum FollowUpUrgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum FollowUpStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  RESPONDED = 'RESPONDED',
  IGNORED = 'IGNORED',
}

export class FollowUp extends BaseEntity {
  customerId: string;
  businessId: string;
  lastInteraction: string;
  daysSinceLastContact: number;
  urgency: FollowUpUrgency;
  status: FollowUpStatus;
  message: string;
  previousIntent?: string;
  metadata: Record<string, any>;

  constructor(
    customerId: string,
    businessId: string,
    lastInteraction: string,
    daysSinceLastContact: number,
    message: string,
    urgency: FollowUpUrgency,
  ) {
    super();
    this.customerId = customerId;
    this.businessId = businessId;
    this.lastInteraction = lastInteraction;
    this.daysSinceLastContact = daysSinceLastContact;
    this.urgency = urgency;
    this.status = FollowUpStatus.PENDING;
    this.message = message;
    this.metadata = {};
  }

  markAsSent(): void {
    this.status = FollowUpStatus.SENT;
    this.updateTimestamp();
  }

  markAsResponded(): void {
    this.status = FollowUpStatus.RESPONDED;
    this.updateTimestamp();
  }

  markAsIgnored(): void {
    this.status = FollowUpStatus.IGNORED;
    this.updateTimestamp();
  }
}

import { BaseEntity } from '../../../../core/domain/shared/entities/base.entity';
import { VoiceMessage, VoiceChannel } from '../value-objects/voice-message';

export enum OutreachStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  READY = 'READY',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export class VoiceOutreach extends BaseEntity {
  customerId: string;
  businessId: string;
  voiceMessage: VoiceMessage;
  status: OutreachStatus;
  sentAt?: Date;
  openedAt?: Date;
  respondedAt?: Date;
  metadata: Record<string, unknown>;

  constructor(
    customerId: string,
    businessId: string,
    voiceMessage: VoiceMessage,
    channel: VoiceChannel,
  ) {
    super();
    this.customerId = customerId;
    this.businessId = businessId;
    this.voiceMessage = voiceMessage;
    this.status = OutreachStatus.PENDING;
    this.metadata = {
      channel,
      createdAt: new Date(),
    };
  }

  markAsGenerating(): void {
    this.status = OutreachStatus.GENERATING;
    this.updateTimestamp();
  }

  markAsReady(): void {
    this.status = OutreachStatus.READY;
    this.updateTimestamp();
  }

  markAsSent(): void {
    this.status = OutreachStatus.SENT;
    this.sentAt = new Date();
    this.updateTimestamp();
  }

  markAsFailed(): void {
    this.status = OutreachStatus.FAILED;
    this.updateTimestamp();
  }

  markAsOpened(): void {
    this.openedAt = new Date();
    this.updateTimestamp();
  }

  markAsResponded(): void {
    this.respondedAt = new Date();
    this.updateTimestamp();
  }
}

import { BaseEntity } from '../../../../core/domain/shared/entities/base.entity';

export enum MessageChannel {
  INSTAGRAM = 'INSTAGRAM',
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  EMAIL = 'EMAIL',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export class Message extends BaseEntity {
  customerId: string;
  businessId: string;
  channel: MessageChannel;
  content: string;
  response?: string;
  status: MessageStatus;
  metadata: Record<string, any>;

  constructor(customerId: string, businessId: string, channel: MessageChannel, content: string) {
    super();
    this.customerId = customerId;
    this.businessId = businessId;
    this.channel = channel;
    this.content = content;
    this.status = MessageStatus.PENDING;
    this.metadata = {};
  }

  markAsSent(response: string): void {
    this.response = response;
    this.status = MessageStatus.SENT;
    this.updateTimestamp();
  }

  markAsDelivered(): void {
    this.status = MessageStatus.DELIVERED;
    this.updateTimestamp();
  }

  markAsRead(): void {
    this.status = MessageStatus.READ;
    this.updateTimestamp();
  }

  markAsFailed(): void {
    this.status = MessageStatus.FAILED;
    this.updateTimestamp();
  }
}

import { BaseEntity } from '../../../../core/domain/shared/entities/base.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export class Booking extends BaseEntity {
  customerId: string;
  businessId: string;
  scheduledTime: Date;
  status: BookingStatus;
  notes?: string;
  metadata: Record<string, unknown>;

  constructor(customerId: string, businessId: string, scheduledTime: Date, notes?: string) {
    super();
    this.customerId = customerId;
    this.businessId = businessId;
    this.scheduledTime = scheduledTime;
    this.status = BookingStatus.PENDING;
    this.notes = notes;
    this.metadata = {};
  }

  confirm(): void {
    this.status = BookingStatus.CONFIRMED;
    this.updateTimestamp();
  }

  cancel(): void {
    this.status = BookingStatus.CANCELLED;
    this.updateTimestamp();
  }

  complete(): void {
    this.status = BookingStatus.COMPLETED;
    this.updateTimestamp();
  }
}

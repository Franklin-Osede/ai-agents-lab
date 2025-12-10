import { Result } from '../../../../core/domain/shared/value-objects/result';

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum EscalationLevel {
  NONE = 0,
  GENTLE_REMINDER = 1, // Email
  URGENT_MESSAGE = 2, // WhatsApp
  FINAL_NOTICE_CALL = 3, // Voice Call
}

export class Invoice {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly amount: number,
    public readonly dueDate: Date,
    public status: InvoiceStatus,
    public escalationLevel: EscalationLevel,
    public lastChasedAt?: Date,
  ) {}

  static create(id: string, customerId: string, amount: number, dueDate: Date): Result<Invoice> {
    if (amount <= 0) {
      return Result.fail(new Error('Amount must be positive'));
    }

    return Result.ok(
      new Invoice(id, customerId, amount, dueDate, InvoiceStatus.PENDING, EscalationLevel.NONE),
    );
  }

  markAsOverdue(): void {
    if (this.status !== InvoiceStatus.PAID) {
      this.status = InvoiceStatus.OVERDUE;
    }
  }

  escalate(): void {
    if (this.escalationLevel < EscalationLevel.FINAL_NOTICE_CALL) {
      this.escalationLevel++;
      this.lastChasedAt = new Date();
    }
  }
}

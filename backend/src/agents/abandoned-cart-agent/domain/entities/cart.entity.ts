import { Result } from '../../../../core/domain/shared/value-objects/result';

export enum CartStatus {
  OPEN = 'OPEN',
  ABANDONED = 'ABANDONED',
  RECOVERED = 'RECOVERED',
  LOST = 'LOST',
}

export class Cart {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly items: string[], // Simplified for demo (could be Item objects)
    public readonly totalValue: number,
    public status: CartStatus,
    public readonly createdAt: Date,
    public lastModifiedAt: Date,
    public recoveryAttempts: number = 0,
  ) {}

  static create(id: string, customerId: string, items: string[], totalValue: number): Result<Cart> {
    if (!id || !customerId) {
      return Result.fail(new Error('Cart ID and Customer ID are required'));
    }
    if (totalValue < 0) {
      return Result.fail(new Error('Total value cannot be negative'));
    }

    return Result.ok(
      new Cart(id, customerId, items, totalValue, CartStatus.OPEN, new Date(), new Date()),
    );
  }

  markAsAbandoned(): void {
    if (this.status === CartStatus.OPEN) {
      this.status = CartStatus.ABANDONED;
      this.lastModifiedAt = new Date();
    }
  }

  markAsRecovered(): void {
    this.status = CartStatus.RECOVERED;
    this.lastModifiedAt = new Date();
  }

  incrementRecoveryAttempts(): void {
    this.recoveryAttempts++;
    this.lastModifiedAt = new Date();
  }
}

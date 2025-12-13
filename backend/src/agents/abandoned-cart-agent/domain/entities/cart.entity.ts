import { Result } from '../../../../core/domain/shared/value-objects/result';
import { CartItem } from '../value-objects/cart-item.vo';

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
    public readonly items: CartItem[], // Now using CartItem value objects
    public readonly totalValue: number,
    public status: CartStatus,
    public readonly createdAt: Date,
    public lastModifiedAt: Date,
    public recoveryAttempts: number = 0,
    public readonly orderId?: string, // If recovered and converted to order
  ) {}

  static create(id: string, customerId: string, items: CartItem[]): Result<Cart> {
    if (!id || !customerId) {
      return Result.fail(new Error('Cart ID and Customer ID are required'));
    }
    if (!items || items.length === 0) {
      return Result.fail(new Error('Cart must have at least one item'));
    }

    // Calculate total from items
    const totalValue = items.reduce((sum, item) => sum + item.getTotalPrice(), 0);

    if (totalValue < 0) {
      return Result.fail(new Error('Total value cannot be negative'));
    }

    return Result.ok(
      new Cart(id, customerId, items, totalValue, CartStatus.OPEN, new Date(), new Date()),
    );
  }

  /**
   * Calculate recovery probability based on cart value and time
   */
  calculateRecoveryProbability(): number {
    const hoursSinceAbandonment = (Date.now() - this.lastModifiedAt.getTime()) / (1000 * 60 * 60);

    // Base probability decreases over time
    let probability = 85;

    // Reduce probability based on time
    if (hoursSinceAbandonment > 24) {
      probability -= 30;
    } else if (hoursSinceAbandonment > 12) {
      probability -= 20;
    } else if (hoursSinceAbandonment > 6) {
      probability -= 10;
    }

    // Increase probability for high-value carts
    if (this.totalValue > 500) {
      probability += 10;
    } else if (this.totalValue > 1000) {
      probability += 15;
    }

    // Reduce probability if too many recovery attempts
    if (this.recoveryAttempts > 2) {
      probability -= 20;
    }

    return Math.max(0, Math.min(100, probability));
  }

  /**
   * Check if cart can be recovered
   */
  canBeRecovered(): boolean {
    return (
      this.status === CartStatus.ABANDONED &&
      this.recoveryAttempts < 3 &&
      this.calculateRecoveryProbability() > 20
    );
  }

  markAsAbandoned(): void {
    if (this.status === CartStatus.OPEN) {
      this.status = CartStatus.ABANDONED;
      this.lastModifiedAt = new Date();
    }
  }

  markAsRecovered(orderId?: string): void {
    this.status = CartStatus.RECOVERED;
    this.lastModifiedAt = new Date();
    if (orderId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).orderId = orderId;
    }
  }

  markAsLost(): void {
    this.status = CartStatus.LOST;
    this.lastModifiedAt = new Date();
  }

  /**
   * Get items as simple strings (for backward compatibility)
   */
  getItemsAsStrings(): string[] {
    return this.items.map((item) => `${item.name} (x${item.quantity})`);
  }

  incrementRecoveryAttempts(): void {
    this.recoveryAttempts++;
    this.lastModifiedAt = new Date();
  }
}

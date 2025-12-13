import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import { CartItem } from '../value-objects/cart-item.vo';

export enum CartStatus {
  OPEN = 'OPEN',
  ABANDONED = 'ABANDONED',
  RECOVERED = 'RECOVERED',
  LOST = 'LOST',
}

@Entity('carts')
export class Cart {
  @PrimaryColumn('uuid')
  public readonly id: string;

  @Column()
  public readonly customerId: string;

  @Column()
  public readonly tenantId: string; // Tenant Isolation

  @Column('jsonb')
  public readonly items: CartItem[]; // Now using CartItem value objects

  @Column('decimal')
  public readonly totalValue: number;

  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatus.OPEN
  })
  public status: CartStatus;

  @CreateDateColumn()
  public readonly createdAt: Date;

  @UpdateDateColumn()
  public lastModifiedAt: Date;

  @Column({ default: 0 })
  public recoveryAttempts: number = 0;

  @Column({ nullable: true })
  public readonly orderId?: string; // If recovered and converted to order

  constructor(
    id: string,
    customerId: string,
    tenantId: string,
    items: CartItem[],
    totalValue: number,
    status: CartStatus,
    createdAt: Date,
    lastModifiedAt: Date,
    recoveryAttempts: number = 0,
    orderId?: string,
  ) {
    this.id = id;
    this.customerId = customerId;
    this.tenantId = tenantId;
    this.items = items;
    this.totalValue = totalValue;
    this.status = status;
    this.createdAt = createdAt;
    this.lastModifiedAt = lastModifiedAt;
    this.recoveryAttempts = recoveryAttempts;
    this.orderId = orderId;
  }

  static create(id: string, customerId: string, tenantId: string, items: CartItem[]): Result<Cart> {
    if (!id || !customerId || !tenantId) {
      return Result.fail(new Error('Cart ID, Customer ID and Tenant ID are required'));
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
      new Cart(id, customerId, tenantId, items, totalValue, CartStatus.OPEN, new Date(), new Date()),
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

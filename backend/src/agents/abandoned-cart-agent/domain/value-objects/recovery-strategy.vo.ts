import { Result } from '../../../../core/domain/shared/value-objects/result';

export enum RecoveryChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

/**
 * RecoveryStrategy Value Object
 *
 * Represents the strategy for recovering an abandoned cart.
 * Follows DDD principles: immutable, validated, business logic encapsulation.
 */
export class RecoveryStrategy {
  private constructor(
    public readonly channel: RecoveryChannel,
    public readonly discountType?: DiscountType,
    public readonly discountValue?: number,
    public readonly discountCode?: string,
    public readonly expirationHours?: number,
    public readonly message?: string,
  ) {}

  static create(
    channel: RecoveryChannel,
    options?: {
      discountType?: DiscountType;
      discountValue?: number;
      discountCode?: string;
      expirationHours?: number;
      message?: string;
    },
  ): Result<RecoveryStrategy> {
    // Validate discount if provided
    if (options?.discountType) {
      if (options.discountType === DiscountType.PERCENTAGE) {
        if (!options.discountValue || options.discountValue <= 0 || options.discountValue > 100) {
          return Result.fail(new Error('Discount percentage must be between 1 and 100'));
        }
      } else if (options.discountType === DiscountType.FIXED_AMOUNT) {
        if (!options.discountValue || options.discountValue <= 0) {
          return Result.fail(new Error('Discount amount must be greater than 0'));
        }
      }
    }

    // Validate expiration
    if (options?.expirationHours && options.expirationHours <= 0) {
      return Result.fail(new Error('Expiration hours must be greater than 0'));
    }

    return Result.ok(
      new RecoveryStrategy(
        channel,
        options?.discountType,
        options?.discountValue,
        options?.discountCode,
        options?.expirationHours,
        options?.message,
      ),
    );
  }

  /**
   * Check if strategy has a discount
   */
  hasDiscount(): boolean {
    return !!this.discountType;
  }

  /**
   * Get discount description
   */
  getDiscountDescription(): string {
    if (!this.hasDiscount()) {
      return '';
    }

    switch (this.discountType) {
      case DiscountType.PERCENTAGE:
        return `${this.discountValue}% de descuento`;
      case DiscountType.FIXED_AMOUNT:
        return `$${this.discountValue?.toFixed(2)} de descuento`;
      case DiscountType.FREE_SHIPPING:
        return 'Envío gratis';
      default:
        return '';
    }
  }

  /**
   * Calculate discount amount for a given cart total
   */
  calculateDiscount(cartTotal: number): number {
    if (!this.hasDiscount() || !this.discountValue) {
      return 0;
    }

    switch (this.discountType) {
      case DiscountType.PERCENTAGE:
        return (cartTotal * this.discountValue) / 100;
      case DiscountType.FIXED_AMOUNT:
        return Math.min(this.discountValue, cartTotal);
      case DiscountType.FREE_SHIPPING:
        return 0; // Free shipping doesn't reduce cart total
      default:
        return 0;
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject() {
    return {
      channel: this.channel,
      discountType: this.discountType,
      discountValue: this.discountValue,
      discountCode: this.discountCode,
      expirationHours: this.expirationHours,
      message: this.message,
      hasDiscount: this.hasDiscount(),
      discountDescription: this.getDiscountDescription(),
    };
  }
}

import { Result } from '../../../../core/domain/shared/value-objects/result';

/**
 * CartItem Value Object
 *
 * Represents a single item in a shopping cart.
 * Follows DDD principles: immutable, validated, business logic encapsulation.
 */
export class CartItem {
  private constructor(
    public readonly productId: string,
    public readonly name: string,
    public readonly quantity: number,
    public readonly unitPrice: number,
    public readonly sku?: string,
    public readonly imageUrl?: string,
  ) {}

  static create(
    productId: string,
    name: string,
    quantity: number,
    unitPrice: number,
    sku?: string,
    imageUrl?: string,
  ): Result<CartItem> {
    if (!productId || !name) {
      return Result.fail(new Error('Product ID and name are required'));
    }
    if (quantity <= 0) {
      return Result.fail(new Error('Quantity must be greater than 0'));
    }
    if (unitPrice < 0) {
      return Result.fail(new Error('Unit price cannot be negative'));
    }

    return Result.ok(new CartItem(productId, name, quantity, unitPrice, sku, imageUrl));
  }

  /**
   * Calculate total price for this item
   */
  getTotalPrice(): number {
    return this.quantity * this.unitPrice;
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject() {
    return {
      productId: this.productId,
      name: this.name,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      totalPrice: this.getTotalPrice(),
      sku: this.sku,
      imageUrl: this.imageUrl,
    };
  }
}

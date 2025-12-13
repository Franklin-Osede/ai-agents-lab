import { Result } from '../../../../core/domain/shared/value-objects/result';

/**
 * Customer Value Object
 *
 * Represents customer information for cart recovery.
 * Follows DDD principles: immutable, validated.
 */
export class Customer {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phoneNumber?: string,
    public readonly company?: string,
    public readonly totalOrders?: number,
    public readonly totalSpent?: number,
  ) {}

  static create(
    id: string,
    name: string,
    email: string,
    phoneNumber?: string,
    company?: string,
    totalOrders?: number,
    totalSpent?: number,
  ): Result<Customer> {
    if (!id || !name || !email) {
      return Result.fail(new Error('ID, name, and email are required'));
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Result.fail(new Error('Invalid email format'));
    }

    return Result.ok(new Customer(id, name, email, phoneNumber, company, totalOrders, totalSpent));
  }

  /**
   * Check if customer has phone number for WhatsApp
   */
  canReceiveWhatsApp(): boolean {
    return !!this.phoneNumber;
  }

  /**
   * Check if customer is VIP (high value)
   */
  isVip(): boolean {
    return (this.totalSpent || 0) > 1000 || (this.totalOrders || 0) > 10;
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      company: this.company,
      totalOrders: this.totalOrders,
      totalSpent: this.totalSpent,
      isVip: this.isVip(),
    };
  }
}

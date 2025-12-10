import { Injectable, Logger } from '@nestjs/common';
import { ICartRepository } from '../../domain/interfaces/cart-repository.interface';
import { Cart, CartStatus } from '../../domain/entities/cart.entity';

@Injectable()
export class InMemoryCartRepository implements ICartRepository {
  private readonly logger = new Logger(InMemoryCartRepository.name);
  private readonly carts: Map<string, Cart> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed a few abandoned carts for testing
    const cart1 = Cart.create(
      'cart-1',
      'customer-1',
      ['Anti-Aging Serum', 'Night Cream'],
      150.0,
    ).value;
    cart1.markAsAbandoned();
    // Artificially age it to resemble an ongoing abandonment
    cart1.lastModifiedAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

    this.carts.set(cart1.id, cart1);

    this.logger.log('InMemoryCartRepository initialized with seed data');
  }

  async save(cart: Cart): Promise<void> {
    this.carts.set(cart.id, cart);
  }

  async findById(id: string): Promise<Cart | null> {
    return this.carts.get(id) || null;
  }

  async findAbandonedCarts(olderThanMinutes: number): Promise<Cart[]> {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    return Array.from(this.carts.values()).filter(
      (cart) =>
        cart.status === CartStatus.ABANDONED &&
        cart.lastModifiedAt <= cutoffTime &&
        cart.recoveryAttempts === 0, // Don't spam
    );
  }
}

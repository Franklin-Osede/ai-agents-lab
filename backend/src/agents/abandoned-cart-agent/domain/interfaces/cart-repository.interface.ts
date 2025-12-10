import { Cart } from '../entities/cart.entity';

export interface ICartRepository {
  save(cart: Cart): Promise<void>;
  findById(id: string): Promise<Cart | null>;
  findAbandonedCarts(olderThanMinutes: number): Promise<Cart[]>;
}

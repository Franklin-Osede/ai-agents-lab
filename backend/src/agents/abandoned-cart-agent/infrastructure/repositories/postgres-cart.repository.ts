import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ICartRepository } from '../../domain/interfaces/cart-repository.interface';
import { Cart, CartStatus } from '../../domain/entities/cart.entity';

@Injectable()
export class PostgresCartRepository implements ICartRepository {
  private readonly logger = new Logger(PostgresCartRepository.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

  async save(cart: Cart): Promise<void> {
    try {
      await this.cartRepository.save(cart);
      this.logger.debug(`Cart saved successfully: ${cart.id}`);
    } catch (error) {
      this.logger.error(`Failed to save cart ${cart.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<Cart | null> {
    try {
      return await this.cartRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to find cart ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAbandonedCarts(olderThanMinutes: number): Promise<Cart[]> {
    try {
      const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

      if (olderThanMinutes === 0) {
        return await this.cartRepository.find({
          where: { status: CartStatus.ABANDONED },
        });
      }

      return await this.cartRepository.find({
        where: {
          status: CartStatus.ABANDONED,
          lastModifiedAt: LessThanOrEqual(cutoffTime),
          recoveryAttempts: 0,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to find abandoned carts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find carts by Tenant ID (Multi-tenancy support)
   */
  async findByTenantId(tenantId: string): Promise<Cart[]> {
    return await this.cartRepository.find({
      where: {
        tenantId: tenantId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}

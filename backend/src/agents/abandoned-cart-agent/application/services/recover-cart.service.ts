import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import { ICartRepository } from '../../domain/interfaces/cart-repository.interface';
import { VoiceAgentService } from '../../../voice-agent/application/services/voice-agent.service';
import { VoiceChannel } from '../../../voice-agent/domain/value-objects/voice-message';
import { Cart } from '../../domain/entities/cart.entity';

@Injectable()
export class RecoverCartService {
  private readonly logger = new Logger(RecoverCartService.name);

  constructor(
    @Inject('ICartRepository') private readonly cartRepository: ICartRepository,
    private readonly voiceAgentService: VoiceAgentService,
  ) {}

  /**
   * Process all abandoned carts older than specified minutes
   */
  async processAbandonedCarts(olderThanMinutes: number = 60): Promise<Result<string>> {
    try {
      const carts = await this.cartRepository.findAbandonedCarts(olderThanMinutes);

      if (carts.length === 0) {
        return Result.ok('No abandoned carts found to recover.');
      }

      this.logger.log(`Found ${carts.length} abandoned carts. Starting recovery...`);

      for (const cart of carts) {
        await this.recoverCart(cart);
      }

      return Result.ok(`Processed ${carts.length} abandoned carts`);
    } catch (error) {
      this.logger.error(`Failed to process abandoned carts: ${(error as Error).message}`);
      return Result.fail(error as Error);
    }
  }

  private async recoverCart(cart: Cart): Promise<void> {
    this.logger.log(`Recovering cart ${cart.id} for customer ${cart.customerId}`);

    // Context for AI to generate script
    const context = `
      Customer abandoned cart with items: ${cart.items.join(', ')}.
      Total value: $${cart.totalValue}.
      Offer: Free shipping if purchased today.
      Goal: Friendly reminder, not pushy.
    `;

    // Agent-to-Agent call
    const voiceResult = await this.voiceAgentService.generateVoiceMessage({
      customerId: cart.customerId,
      businessId: 'cosmetics-shop', // Context
      context,
      channel: VoiceChannel.WHATSAPP,
      includeVideo: false,
    });

    if (voiceResult.isSuccess) {
      this.logger.log(`Voice note generated for cart ${cart.id}: ${voiceResult.value.audioUrl}`);

      // In a real app, we would send this URL via WhatsApp API here.
      // For now, we update the cart state.

      cart.incrementRecoveryAttempts();
      await this.cartRepository.save(cart);
    } else {
      this.logger.error(`Failed to generate voice note for cart ${cart.id}: ${voiceResult.error}`);
    }
  }
}

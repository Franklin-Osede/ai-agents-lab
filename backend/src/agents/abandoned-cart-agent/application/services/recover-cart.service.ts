import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import { ICartRepository } from '../../domain/interfaces/cart-repository.interface';
import { VoiceAgentService } from '../../../voice-agent/application/services/voice-agent.service';
import { VoiceChannel } from '../../../voice-agent/domain/value-objects/voice-message';
import { Cart } from '../../domain/entities/cart.entity';
import { WhatsAppService } from '../../../../core/integrations/whatsapp.service';
import { EmailPreviewService } from '../../../../core/integrations/email-preview.service';

@Injectable()
export class RecoverCartService {
  private readonly logger = new Logger(RecoverCartService.name);

  constructor(
    @Inject('ICartRepository') private readonly cartRepository: ICartRepository,
    private readonly voiceAgentService: VoiceAgentService,
    private readonly whatsappService: WhatsAppService,
    private readonly emailPreviewService: EmailPreviewService,
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
    if (!cart.canBeRecovered()) {
      this.logger.warn(
        `Cart ${cart.id} cannot be recovered (status: ${cart.status}, attempts: ${cart.recoveryAttempts})`,
      );
      return;
    }

    this.logger.log(`Recovering cart ${cart.id} for customer ${cart.customerId}`);
    const probability = cart.calculateRecoveryProbability();
    this.logger.log(`Recovery probability: ${probability}%`);

    // Build context for AI to generate script
    const itemsDescription = cart.items
      .map((item) => `${item.name} (x${item.quantity})`)
      .join(', ');
    const context = `
      Customer abandoned cart with items: ${itemsDescription}.
      Total value: $${cart.totalValue.toFixed(2)}.
      Recovery probability: ${probability}%.
      Time since abandonment: ${Math.round((Date.now() - cart.lastModifiedAt.getTime()) / (1000 * 60 * 60))} hours.
      Offer: Free shipping if purchased today.
      Goal: Friendly reminder, not pushy. Personalize based on cart value and customer history.
    `;

    // Agent-to-Agent call to generate voice message
    const voiceResult = await this.voiceAgentService.generateVoiceMessage({
      customerId: cart.customerId,
      businessId: 'agentics', // Company name from user
      context,
      channel: VoiceChannel.WHATSAPP,
      includeVideo: false,
    });

    if (voiceResult.isSuccess) {
      this.logger.log(`Voice note generated for cart ${cart.id}: ${voiceResult.value.audioUrl}`);

      // Send WhatsApp message with audio
      // Note: In production, you'd get the customer's phone number from the database
      const customerPhone = `+34612345678`; // TODO: Get from customer data

      const whatsappResult = await this.whatsappService.sendMediaMessage({
        to: customerPhone,
        message: `Hola! Notamos que dejaste productos en tu carrito. Escucha este mensaje personalizado:`,
        mediaUrl: voiceResult.value.audioUrl,
      });

      if (whatsappResult.success) {
        this.logger.log(
          `WhatsApp message sent successfully. Message ID: ${whatsappResult.messageId}`,
        );
        cart.incrementRecoveryAttempts();
        await this.cartRepository.save(cart);
      } else {
        this.logger.warn(`WhatsApp message failed: ${whatsappResult.error}`);
      }
    } else {
      this.logger.error(`Failed to generate voice note for cart ${cart.id}: ${voiceResult.error}`);
    }
  }
}

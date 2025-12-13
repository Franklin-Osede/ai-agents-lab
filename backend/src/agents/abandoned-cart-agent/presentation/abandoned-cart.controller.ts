import { Controller, Post, Body, Get, Param, Logger, Inject } from '@nestjs/common';
import { RecoverCartService } from '../application/services/recover-cart.service';
import { WhatsAppService } from '../../../core/integrations/whatsapp.service';
import { EmailPreviewService } from '../../../core/integrations/email-preview.service';
import { ICartRepository } from '../domain/interfaces/cart-repository.interface';

@Controller('api/v1/agents/abandoned-cart')
export class AbandonedCartController {
  private readonly logger = new Logger(AbandonedCartController.name);

  constructor(
    private readonly recoverCartService: RecoverCartService,
    private readonly whatsappService: WhatsAppService,
    private readonly emailPreviewService: EmailPreviewService,
    @Inject('ICartRepository') private readonly cartRepository: ICartRepository,
  ) {}

  @Post('trigger')
  async triggerRecovery(@Body() body: { olderThanMinutes?: number }) {
    this.logger.log('Triggering abandoned cart recovery manually');

    const minutes = body.olderThanMinutes || 60;
    const result = await this.recoverCartService.processAbandonedCarts(minutes);

    if (result.isFailure) {
      return {
        success: false,
        message: result.error?.message,
      };
    }

    return {
      success: true,
      message: result.value,
    };
  }

  /**
   * Envía un mensaje de WhatsApp para recuperar un carrito
   */
  @Post('send-whatsapp')
  async sendWhatsApp(
    @Body() body: { cartId: string; phoneNumber: string; message?: string; audioUrl?: string },
  ) {
    this.logger.log(`Sending WhatsApp for cart ${body.cartId} to ${body.phoneNumber}`);

    if (body.audioUrl) {
      const result = await this.whatsappService.sendMediaMessage({
        to: body.phoneNumber,
        message: body.message || 'Hola! Notamos que dejaste productos en tu carrito.',
        mediaUrl: body.audioUrl,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        isEnabled: this.whatsappService.isServiceEnabled(),
      };
    } else {
      const result = await this.whatsappService.sendTextMessage({
        to: body.phoneNumber,
        message:
          body.message ||
          'Hola! Notamos que dejaste productos en tu carrito. ¿Te gustaría completar tu compra?',
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        isEnabled: this.whatsappService.isServiceEnabled(),
      };
    }
  }

  /**
   * Genera un preview de email de recuperación de carrito (sin enviar)
   */
  @Post('preview-email')
  async previewEmail(
    @Body()
    body: {
      cartId: string;
      customerName: string;
      customerEmail: string;
      cartItems: Array<{ name: string; quantity: number; price: number }>;
      cartTotal: number;
      discountCode?: string;
      discountPercent?: number;
      discountAmount?: number;
      expirationHours?: number;
      recoveryLink?: string;
    },
  ) {
    this.logger.log(`Generating email preview for cart ${body.cartId}`);

    const preview = this.emailPreviewService.generateCartRecoveryEmail({
      to: body.customerEmail,
      toName: body.customerName,
      subject: `🛒 Completa tu compra - ${body.cartItems.length} productos te esperan`,
      cartItems: body.cartItems,
      cartTotal: body.cartTotal,
      discountCode: body.discountCode,
      discountPercent: body.discountPercent,
      discountAmount: body.discountAmount,
      expirationHours: body.expirationHours,
      recoveryLink: body.recoveryLink,
    });

    return {
      success: true,
      html: preview.html,
      text: preview.text,
      subject: preview.subject,
      note: 'Este es un preview. El email NO se ha enviado realmente.',
    };
  }

  /**
   * Obtiene información sobre el estado de los servicios
   */
  @Get('services-status')
  getServicesStatus() {
    return {
      whatsapp: {
        enabled: this.whatsappService.isServiceEnabled(),
        note: this.whatsappService.isServiceEnabled()
          ? 'WhatsApp está configurado y listo para enviar mensajes reales'
          : 'WhatsApp está en modo simulación. Configura TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN para habilitarlo',
      },
      email: {
        enabled: true,
        mode: 'preview',
        note: 'El servicio de email está en modo preview. Los emails se generan pero NO se envían realmente.',
      },
    };
  }

  /**
   * Get all abandoned carts (for frontend)
   */
  @Get('list')
  async getCarts() {
    // Get all carts from repository (olderThanMinutes = 0 to get all)
    const carts = await this.cartRepository.findAbandonedCarts(0);
    return carts.map((cart) => ({
      id: cart.id,
      customerId: cart.customerId,
      items: cart.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.getTotalPrice(),
        sku: item.sku,
        imageUrl: item.imageUrl,
      })),
      totalValue: cart.totalValue,
      status: cart.status,
      createdAt: cart.createdAt,
      lastModifiedAt: cart.lastModifiedAt,
      recoveryAttempts: cart.recoveryAttempts,
      recoveryProbability: cart.calculateRecoveryProbability(),
    }));
  }

  /**
   * Get cart by ID
   */
  @Get(':id')
  async getCartById(@Param('id') id: string) {
    const cart = await this.cartRepository.findById(id);
    if (!cart) {
      return { error: 'Cart not found' };
    }
    return {
      id: cart.id,
      customerId: cart.customerId,
      items: cart.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.getTotalPrice(),
        sku: item.sku,
        imageUrl: item.imageUrl,
      })),
      totalValue: cart.totalValue,
      status: cart.status,
      createdAt: cart.createdAt,
      lastModifiedAt: cart.lastModifiedAt,
      recoveryAttempts: cart.recoveryAttempts,
      recoveryProbability: cart.calculateRecoveryProbability(),
    };
  }
}

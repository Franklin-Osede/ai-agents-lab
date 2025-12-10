import { Controller, Post, Body, Logger } from '@nestjs/common';
import { RecoverCartService } from '../application/services/recover-cart.service';

@Controller('api/v1/agents/abandoned-cart')
export class AbandonedCartController {
  private readonly logger = new Logger(AbandonedCartController.name);

  constructor(private readonly recoverCartService: RecoverCartService) {}

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
}

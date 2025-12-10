import { Controller, Post, Logger } from '@nestjs/common';
import { InvoiceChaserService } from '../application/services/invoice-chaser.service';

@Controller('api/v1/agents/invoice-chaser')
export class InvoiceChaserController {
  private readonly logger = new Logger(InvoiceChaserController.name);

  constructor(private readonly chaserService: InvoiceChaserService) {}

  @Post('trigger')
  async triggerChaser() {
    this.logger.log('Triggering invoice chaser manually');

    const result = await this.chaserService.chaseInvoices();

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

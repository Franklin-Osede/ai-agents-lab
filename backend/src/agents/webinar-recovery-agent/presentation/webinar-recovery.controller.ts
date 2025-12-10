import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WebinarRecoveryService } from '../application/services/webinar-recovery.service';

@Controller('api/v1/agents/webinar-recovery')
export class WebinarRecoveryController {
  private readonly logger = new Logger(WebinarRecoveryController.name);

  constructor(private readonly recoveryService: WebinarRecoveryService) {}

  @Post('trigger')
  async triggerRecovery(@Body() body: { webinarId: string }) {
    this.logger.log(`Triggering webinar recovery for ID: ${body.webinarId}`);

    if (!body.webinarId) {
      return { success: false, message: 'webinarId is required' };
    }

    const result = await this.recoveryService.processRecovery(body.webinarId);

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

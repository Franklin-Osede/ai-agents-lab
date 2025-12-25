import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeadCaptureService } from './lead-capture.service';

/**
 * Lead Capture Controller
 *
 * Handles lead capture from demos and generates API keys
 */
@ApiTags('Marketing')
@Controller('marketing')
export class LeadCaptureController {
  private readonly logger = new Logger(LeadCaptureController.name);

  constructor(private readonly leadCaptureService: LeadCaptureService) {}

  @Post('capture-lead')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capture lead from demo and generate API key' })
  async captureLead(
    @Body() body: { email: string; name: string; agentId?: string; source?: string },
  ) {
    try {
      const result = await this.leadCaptureService.captureLead({
        email: body.email,
        name: body.name,
        agentId: body.agentId,
        source: body.source || 'demo',
      });

      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Error processing your request. Please try again.',
        };
      }

      this.logger.log(`Lead captured and API key generated for ${body.email}`);

      return {
        success: true,
        message: 'API key generated successfully',
        apiKey: result.apiKey, // Only shown once
        tenantId: result.tenantId,
        trialEndsAt: result.trialEndsAt,
        dashboardUrl: `https://agentslab.ai/dashboard?tenant=${result.tenantId}`,
      };
    } catch (error) {
      this.logger.error('Error capturing lead:', error);
      return {
        success: false,
        message: 'Error processing your request. Please try again.',
      };
    }
  }
}


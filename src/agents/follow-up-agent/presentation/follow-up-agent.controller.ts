import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FollowUpAgentService } from '../application/services/follow-up-agent.service';
import { GenerateFollowUpDto } from './dto/generate-follow-up.dto';
import { FollowUpResponseDto } from './dto/follow-up-response.dto';

@ApiTags('Follow-up Agent')
@Controller('agents/follow-up')
export class FollowUpAgentController {
  constructor(private readonly followUpAgentService: FollowUpAgentService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a follow-up message for a customer' })
  @ApiResponse({ status: 200, type: FollowUpResponseDto })
  async generateFollowUp(@Body() dto: GenerateFollowUpDto): Promise<FollowUpResponseDto> {
    const result = await this.followUpAgentService.generateFollowUp({
      customerId: dto.customerId,
      businessId: dto.businessId,
      lastInteraction: dto.lastInteraction,
      daysSinceLastContact: dto.daysSinceLastContact,
      previousIntent: dto.previousIntent,
      context: dto.context,
    });

    if (result.isFailure) {
      return {
        success: false,
        message: 'Error generating follow-up message',
        urgency: 'LOW',
        suggestedNextSteps: [],
      };
    }

    return result.value;
  }
}

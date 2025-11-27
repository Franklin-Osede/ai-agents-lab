import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DmResponseAgentService } from '../application/services/dm-response-agent.service';
import { ProcessDmRequestDto } from './dto/process-dm-request.dto';
import { DmResponseDto } from './dto/dm-response.dto';

@ApiTags('DM Response Agent')
@Controller('agents/dm-response')
export class DmResponseAgentController {
  constructor(private readonly dmResponseAgentService: DmResponseAgentService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a DM message and generate response' })
  @ApiResponse({ status: 200, type: DmResponseDto })
  async processDm(@Body() dto: ProcessDmRequestDto): Promise<DmResponseDto> {
    const result = await this.dmResponseAgentService.processDm({
      message: dto.message,
      customerId: dto.customerId,
      businessId: dto.businessId,
      channel: dto.channel,
      context: dto.context,
    });

    if (result.isFailure) {
      return {
        success: false,
        response: 'Sorry, I encountered an error. Please try again.',
        intent: {
          type: 'UNKNOWN',
          confidence: 0,
        },
      };
    }

    return result.value;
  }
}

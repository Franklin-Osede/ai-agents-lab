import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VoiceAgentService } from '../application/services/voice-agent.service';
import { GenerateVoiceDto } from './dto/generate-voice.dto';
import { VoiceResponseDto } from './dto/voice-response.dto';

@ApiTags('Voice Agent')
@Controller('agents/voice')
export class VoiceAgentController {
  constructor(private readonly voiceAgentService: VoiceAgentService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate personalized voice/video message' })
  @ApiResponse({ status: 200, type: VoiceResponseDto })
  async generateVoice(@Body() dto: GenerateVoiceDto): Promise<VoiceResponseDto> {
    const result = await this.voiceAgentService.generateVoiceMessage({
      customerId: dto.customerId,
      businessId: dto.businessId,
      context: dto.context,
      channel: dto.channel,
      includeVideo: dto.includeVideo,
      avatarImageUrl: dto.avatarImageUrl,
      customerName: dto.customerName,
      language: dto.language,
    });

    if (result.isFailure) {
      return {
        success: false,
        script: '',
        audioUrl: '',
        estimatedCost: 0,
        message: 'An error occurred generating the voice message',
      };
    }

    const voiceMessage = result.value;
    return {
      success: true,
      ...voiceMessage.toPlainObject(),
    };
  }
}

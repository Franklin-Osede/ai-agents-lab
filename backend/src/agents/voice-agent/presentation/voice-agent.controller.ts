import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { VoiceAgentService } from '../application/services/voice-agent.service';
import { GenerateVoiceDto } from './dto/generate-voice.dto';
import { VoiceResponseDto } from './dto/voice-response.dto';
import { VoiceInteractDto } from './dto/voice-interact.dto';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../core/domain/agents/interfaces/ai-provider.interface';
import { PollyService } from '../../../core/services/polly.service';

@ApiTags('Voice Agent')
@Controller('agents/voice')
export class VoiceAgentController {
  constructor(
    private readonly voiceAgentService: VoiceAgentService,
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: IAiProvider,
    private readonly pollyService: PollyService,
  ) {}

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

  @Post('interact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Interactive voice conversation - STT + AI + TTS' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Returns audio response with transcripts in headers',
    headers: {
      'X-Transcript-User': {
        description: 'User speech transcription',
        schema: { type: 'string' },
      },
      'X-Transcript-AI': { description: 'AI response text', schema: { type: 'string' } },
    },
  })
  @UseInterceptors(FileInterceptor('audio'))
  async interact(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: VoiceInteractDto,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      // 1. Transcribe user audio (Whisper)
      const userTranscript = await this.aiProvider.transcribeAudio(file.buffer);

      // 2. Generate AI response
      const systemPrompt =
        dto.systemPrompt ||
        'You are a helpful AI assistant for abandoned cart recovery. Be brief, friendly, and encouraging.';
      const aiResponse = await this.aiProvider.generateResponse(userTranscript, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 150,
      });

      // 3. Convert AI response to speech (TTS)
      const audioBuffer = await this.aiProvider.generateAudio(aiResponse);

      // 4. Set headers with transcripts (URL encoded for safety)
      res.setHeader('X-Transcript-User', encodeURIComponent(userTranscript));
      res.setHeader('X-Transcript-AI', encodeURIComponent(aiResponse));
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length.toString());

      // 5. Send audio response
      return res.send(audioBuffer);
    } catch (error) {
      console.error('Voice interaction error:', error);
      return res.status(500).json({
        error: 'Failed to process voice interaction',
        details: error.message,
      });
    }
  }

  @Post('generate-greeting')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate greeting audio from text (TTS only)' })
  @ApiResponse({ status: 200, description: 'Returns audio file' })
  async generateGreeting(@Body('text') text: string, @Res() res: Response) {
    try {
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      // Use AWS Polly Neural voice (Lucia by default)
      const audioStream = await this.pollyService.synthesizeSpeech(text, 'Lucia');

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }
      const audioBuffer = Buffer.concat(chunks);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length.toString());

      return res.send(audioBuffer);
    } catch (error) {
      console.error('Greeting generation error:', error);
      return res.status(500).json({
        error: 'Failed to generate greeting',
        details: error.message,
      });
    }
  }
}

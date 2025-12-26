import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { OpenAiProvider } from '../../../../core/infrastructure/ai/openai.provider';
import { PollyService } from '../../../../core/services/polly.service';

@Controller('agents/voice')
export class VoiceController {
  constructor(
    private readonly openAi: OpenAiProvider,
    private readonly pollyService: PollyService,
  ) {}

  @Post('interact')
  @UseInterceptors(FileInterceptor('audio'))
  async interact(
    @UploadedFile() file: Express.Multer.File,
    @Body('systemPrompt') systemPrompt: string,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    try {
      // 1. Transcribe Audio (Whisper)
      const transcript = await this.openAi.transcribeAudio(file.buffer);
      console.log('User said:', transcript);

      // 2. Get AI Response (GPT-4o)
      const defaultSystemPrompt =
        'Eres un asistente de ventas experto y amable. Mantén tus respuestas breves (máximo 2 frases) y coloquiales. Estás hablando por voz.';
      const aiText = await this.openAi.generateResponse(transcript, {
        systemPrompt: systemPrompt || defaultSystemPrompt,
        model: 'gpt-4o-mini',
        maxTokens: 100,
      });
      console.log('AI replied:', aiText);

      // 3. Generate Audio (TTS)
      const audioBuffer = await this.openAi.generateAudio(aiText);

      // 4. Return Audio + Text Headers
      res.set({
        'Content-Type': 'audio/mpeg',
        'X-Transcript-User': encodeURIComponent(transcript),
        'X-Transcript-AI': encodeURIComponent(aiText),
      });

      res.send(audioBuffer);
    } catch (error) {
      console.error('Voice interaction error:', error);
      res.status(500).json({ error: 'Voice interaction failed' });
    }
  }

  @Post('generate-greeting')
  async generateGreeting(@Body() body: { text: string; agentType?: string }, @Res() res: Response) {
    try {
      // Use AWS Polly Neural voices (premium quality)
      const voiceMap: Record<string, 'Lucia' | 'Sergio' | 'Mia'> = {
        cart: 'Lucia', // Spanish Neural Female
        rider: 'Sergio', // Spanish Neural Male
        booking: 'Mia', // Mexican Neural Female
        default: 'Lucia',
      };

      const voiceId = voiceMap[body.agentType || 'default'];

      console.log(
        `🎙️ [Polly] Generating greeting for agent: ${body.agentType || 'default'} with voice: ${voiceId}`,
      );

      // Use Polly Service instead of OpenAI
      const audioStream = await this.pollyService.synthesizeSpeech(body.text, voiceId);

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }
      const audioBuffer = Buffer.concat(chunks);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      });

      res.send(audioBuffer);
    } catch (error) {
      console.error('Greeting generation error:', error);
      res.status(500).json({ error: 'Greeting generation failed' });
    }
  }
}

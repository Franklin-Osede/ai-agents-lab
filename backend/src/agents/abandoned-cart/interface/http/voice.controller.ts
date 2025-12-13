import { Controller, Post, UseInterceptors, UploadedFile, Body, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { OpenAiProvider } from '../../../../core/infrastructure/ai/openai.provider';

@Controller('agents/voice')
export class VoiceController {
  constructor(private readonly openAi: OpenAiProvider) {}

  @Post('interact')
  @UseInterceptors(FileInterceptor('audio'))
  async interact(
    @UploadedFile() file: Express.Multer.File,
    @Body('systemPrompt') systemPrompt: string,
    @Res() res: Response
  ) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    try {
      // 1. Transcribe Audio (Whisper)
      const transcript = await this.openAi.transcribeAudio(file.buffer);
      console.log('User said:', transcript);

      // 2. Get AI Response (GPT-4o)
      const defaultSystemPrompt = "Eres un asistente de ventas experto y amable. Mantén tus respuestas breves (máximo 2 frases) y coloquiales. Estás hablando por voz.";
      const aiText = await this.openAi.generateResponse(transcript, {
        systemPrompt: systemPrompt || defaultSystemPrompt,
        model: 'gpt-4o-mini',
        maxTokens: 100
      });
      console.log('AI replied:', aiText);

      // 3. Generate Audio (TTS)
      const audioBuffer = await this.openAi.generateAudio(aiText);

      // 4. Return Audio + Text Headers
      res.set({
        'Content-Type': 'audio/mpeg',
        'X-Transcript-User': encodeURIComponent(transcript),
        'X-Transcript-AI': encodeURIComponent(aiText)
      });
      
      res.send(audioBuffer);

    } catch (error) {
      console.error('Voice interaction error:', error);
      res.status(500).json({ error: 'Voice interaction failed' });
    }
  }
}

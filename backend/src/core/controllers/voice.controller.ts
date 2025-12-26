import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { PollyService } from '../services/polly.service';

@Controller('voice')
export class VoiceController {
  private readonly logger = new Logger(VoiceController.name);

  constructor(private readonly pollyService: PollyService) {}

  @Post('speak')
  async speak(@Body('text') text: string, @Body('voiceId') voiceId: string, @Res() res: Response) {
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    try {
      const audioStream = await this.pollyService.synthesizeSpeech(text, voiceId);

      res.setHeader('Content-Type', 'audio/mpeg');
      // Stream the audio directly to the response
      audioStream.pipe(res);
    } catch (error) {
      this.logger.error('Error in speak endpoint', error);
      res.status(500).json({ message: 'TTS synthesis failed' });
    }
  }
}

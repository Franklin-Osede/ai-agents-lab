import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IAiProvider } from '../../domain/agents/interfaces/ai-provider.interface';

@Injectable()
export class OpenAiProvider implements IAiProvider {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(prompt: string, context?: Record<string, unknown>): Promise<string> {
    const systemPrompt = context?.systemPrompt || 'You are a helpful AI assistant.';
    const userPrompt = context?.userPrompt || prompt;

    const completion = await this.client.chat.completions.create({
      model: (context?.model as string) || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt as string },
        { role: 'user', content: userPrompt as string },
      ] as any,
      temperature: (context?.temperature as number) || 0.7,
      max_tokens: (context?.maxTokens as number) || 500,
    });

    return completion.choices[0]?.message?.content || '';
  }

  async classifyIntent(
    message: string,
    intents: string[],
  ): Promise<{ intent: string; confidence: number }> {
    const prompt = `Classify the following message into one of these intents: ${intents.join(', ')}.
    
Message: "${message}"

Respond with JSON format: {"intent": "INTENT_NAME", "confidence": 0.0-1.0}`;

    const response = await this.generateResponse(prompt, {
      temperature: 0.3,
      maxTokens: 100,
    });

    try {
      const parsed = JSON.parse(response);
      return {
        intent: parsed.intent || intents[0],
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      return {
        intent: intents[0],
        confidence: 0.5,
      };
    }
  }

  async transcribeAudio(fileBuffer: Buffer): Promise<string> {
    try {
      // Create a File object from the buffer using a workaround for node-fetch/openai compatibility
      // In a real staging environment we might need to use 'fs' to write to tmp first,
      // but 'openai' SDK supports 'FileLike' object or 'fs.ReadStream'. 
      // For now, let's use the 'toFile' helper if available or a mock File implementation.
      // Since 'openai' > 4.0 accepts a 'File' object (Web API), we can use a small polyfill or `fetch-blob`.
      // Simplest approach: Use the 'file' argument as is if the controller handles it, 
      // but usually the controller gives a Buffer.
      
      const file = await OpenAI.toFile(fileBuffer, 'voice_input.webm', { type: 'audio/webm' });

      const transcription = await this.client.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'es', // Force Spanish as requested
      });

      return transcription.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async generateAudio(text: string): Promise<Buffer> {
    try {
      // Use more natural and cheerful Spanish voices
      // nova = female, warm, natural
      // shimmer = female, expressive, cheerful
      const spanishVoices: Array<'nova' | 'shimmer'> = ['nova', 'shimmer'];
      const randomVoice = spanishVoices[Math.floor(Math.random() * spanishVoices.length)];

      const mp3 = await this.client.audio.speech.create({
        model: 'tts-1',
        voice: randomVoice,
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('Error generating audio:', error);
      throw new Error('Failed to generate audio');
    }
  }
}

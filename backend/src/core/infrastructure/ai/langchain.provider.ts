import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
import OpenAI from 'openai';

export interface IAiProvider {
  generateResponse(prompt: string, context?: { systemPrompt?: string }): Promise<string>;
  generateResponseWithTools(
    messages: BaseMessage[],
    tools: unknown[],
  ): Promise<{ response: BaseMessage; toolCalls?: unknown[] }>;
}

@Injectable()
export class LangChainProvider implements IAiProvider {
  private readonly logger = new Logger(LangChainProvider.name);
  private model: ChatOpenAI;
  private openaiClient: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY not found in environment variables');
    }

    this.model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4o', // Or gpt-3.5-turbo if cost is a concern
      temperature: 0.7,
    });

    // Initialize OpenAI client for audio features
    this.openaiClient = new OpenAI({ apiKey });
  }

  async generateResponse(prompt: string, context?: { systemPrompt?: string }): Promise<string> {
    try {
      const response = await this.model.invoke([
        new SystemMessage(context?.systemPrompt || 'You are a helpful assistant.'),
        new HumanMessage(prompt),
      ]);

      // Handle different content types (string vs complex content)
      if (typeof response.content === 'string') {
        return response.content;
      } else {
        // If content is an array (e.g. multimodal), join text parts
        return Array.isArray(response.content)
          ? response.content.map((c: any): string => c.text || '').join('') // eslint-disable-line @typescript-eslint/no-explicit-any
          : JSON.stringify(response.content);
      }
    } catch (error) {
      this.logger.error('Error generating AI response:', error);
      throw error;
    }
  }

  async generateResponseWithTools(
    messages: BaseMessage[],
    tools: unknown[],
  ): Promise<{ response: BaseMessage; toolCalls?: unknown[] }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modelWithTools = this.model.bindTools(tools as any[]);
      const response = await modelWithTools.invoke(messages);

      return {
        response,
        toolCalls: response.tool_calls,
      };
    } catch (error) {
      this.logger.error('Error generating AI response with tools:', error);
      throw error;
    }
  }

  async classifyIntent(
    message: string,
    intents: string[],
  ): Promise<{ intent: string; confidence: number }> {
    const prompt = `Classify the following message into one of these intents: ${intents.join(', ')}.
Message: "${message}"
Return ONLY a valid JSON object like: {"intent": "selected_intent", "confidence": 0.9}`;

    const response = await this.generateResponse(prompt);
    try {
      // Clean up response if it contains markdown code blocks
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      this.logger.error('Error parsing intent classification response:', error);
      // Fallback
      return { intent: intents[0], confidence: 0.0 };
    }
  }

  // Audio methods - delegate to OpenAI client
  async transcribeAudio(fileBuffer: Buffer): Promise<string> {
    try {
      const file = await OpenAI.toFile(fileBuffer, 'voice_input.webm', { type: 'audio/webm' });
      const transcription = await this.openaiClient.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'es',
      });
      return transcription.text;
    } catch (error) {
      this.logger.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async generateAudio(text: string): Promise<Buffer> {
    try {
      // Random gender selection for Spanish (Spain) voices
      // alloy = female voice, onyx = male voice
      const spanishVoices: Array<'alloy' | 'onyx'> = ['alloy', 'onyx'];
      const randomVoice = spanishVoices[Math.floor(Math.random() * spanishVoices.length)];

      const mp3 = await this.openaiClient.audio.speech.create({
        model: 'tts-1',
        voice: randomVoice, // Random Spanish (Spain) voice
        input: text,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    } catch (error) {
      this.logger.error('Error generating audio:', error);
      throw new Error('Failed to generate audio');
    }
  }

  getLLM(): ChatOpenAI {
    return this.model;
  }
}

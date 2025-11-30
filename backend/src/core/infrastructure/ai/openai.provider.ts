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

  async generateResponse(prompt: string, context?: Record<string, any>): Promise<string> {
    const systemPrompt = context?.systemPrompt || 'You are a helpful AI assistant.';
    const userPrompt = context?.userPrompt || prompt;

    const completion = await this.client.chat.completions.create({
      model: context?.model || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: context?.temperature || 0.7,
      max_tokens: context?.maxTokens || 500,
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
    } catch {
      return {
        intent: intents[0],
        confidence: 0.5,
      };
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

export interface IAiProvider {
  generateResponse(prompt: string, context?: any): Promise<string>;
  generateResponseWithTools(
    messages: BaseMessage[],
    tools: any[],
  ): Promise<{ response: BaseMessage; toolCalls?: any[] }>;
}

@Injectable()
export class LangChainProvider implements IAiProvider {
  private readonly logger = new Logger(LangChainProvider.name);
  private model: ChatOpenAI;

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
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
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
          ? response.content.map((c: any) => c.text || '').join('')
          : JSON.stringify(response.content);
      }
    } catch (error) {
      this.logger.error('Error generating AI response:', error);
      throw error;
    }
  }

  async generateResponseWithTools(
    messages: BaseMessage[],
    tools: any[],
  ): Promise<{ response: BaseMessage; toolCalls?: any[] }> {
    try {
      const modelWithTools = this.model.bindTools(tools);
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
}

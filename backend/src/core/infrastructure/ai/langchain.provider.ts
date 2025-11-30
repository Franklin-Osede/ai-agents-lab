import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { IAiProvider } from '../../domain/agents/interfaces/ai-provider.interface';

/**
 * LangChainProvider
 *
 * Reusable LangChain-based AI provider that implements IAiProvider.
 * Supports memory and tools (optional) for advanced agent capabilities.
 *
 * Designed to be used by all agents (booking, dm-response, follow-up, etc.)
 */
@Injectable()
export class LangChainProvider implements IAiProvider {
  private readonly logger = new Logger(LangChainProvider.name);
  private llm: ChatOpenAI | null = null;
  private readonly memories: Map<string, InMemoryChatMessageHistory> = new Map();

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey || apiKey === 'your-api-key-here') {
      this.logger.warn(
        'OPENAI_API_KEY not configured for LangChainProvider. Provider will be available but may fail when used.',
      );
      // Don't throw error, allow lazy initialization
      return;
    }

    try {
      this.llm = new ChatOpenAI({
        modelName: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: 0.7,
        openAIApiKey: apiKey,
        maxTokens: 500,
      });

      this.logger.log('LangChainProvider initialized');
    } catch (error) {
      this.logger.warn(`LangChainProvider initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate response using LangChain ChatOpenAI
   * Implements IAiProvider interface for compatibility
   */
  async generateResponse(prompt: string, context?: Record<string, unknown>): Promise<string> {
    try {
      const systemPrompt = (context?.systemPrompt as string) || 'You are a helpful AI assistant.';
      const userPrompt = (context?.userPrompt as string) || prompt;
      const temperature = (context?.temperature as number) || 0.7;
      const maxTokens = (context?.maxTokens as number) || 500;

      // Create messages
      const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];

      // Use memory if conversation key is provided
      const conversationKey = context?.conversationKey as string | undefined;
      if (conversationKey) {
        const memory = this.getOrCreateMemory(conversationKey);
        const history = await memory.getMessages();

        if (history && history.length > 0) {
          // Prepend conversation history (filter to only HumanMessage and SystemMessage)
          const historyMessages = history.filter(
            (msg): msg is HumanMessage | SystemMessage =>
              msg instanceof HumanMessage || msg instanceof SystemMessage,
          );
          messages.unshift(...historyMessages);
        }
      }

      // Create a new LLM instance with the specific temperature for this call
      const llmWithTemp = new ChatOpenAI({
        modelName: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature,
        openAIApiKey: this.configService.get<string>('OPENAI_API_KEY')!,
        maxTokens,
      });

      // Invoke LLM
      const response = await llmWithTemp.invoke(messages);

      const content = response.content as string;

      // Save to memory if conversation key is provided
      if (conversationKey) {
        const memory = this.getOrCreateMemory(conversationKey);
        await memory.addUserMessage(userPrompt);
        await memory.addAIMessage(content);
      }

      return content;
    } catch (error) {
      this.logger.error(`Error generating response: ${error.message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Classify intent using LangChain
   * Implements IAiProvider interface for compatibility
   */
  async classifyIntent(
    message: string,
    intents: string[],
  ): Promise<{ intent: string; confidence: number }> {
    try {
      const prompt = `Classify the following message into one of these intents: ${intents.join(', ')}.

Message: "${message}"

Respond with JSON format: {"intent": "INTENT_NAME", "confidence": 0.0-1.0}`;

      const response = await this.generateResponse(prompt, {
        temperature: 0.3,
        maxTokens: 100,
      });

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const parsed = JSON.parse(jsonString);

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
    } catch (error) {
      this.logger.error(`Error classifying intent: ${error.message}`, (error as Error).stack);
      return {
        intent: intents[0],
        confidence: 0.5,
      };
    }
  }

  /**
   * Get the underlying ChatOpenAI LLM instance
   * Useful for creating chains with tools
   */
  getLLM(): ChatOpenAI {
    if (!this.llm) {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey || apiKey === 'your-api-key-here') {
        throw new Error('OPENAI_API_KEY is required for LangChainProvider');
      }
      this.llm = new ChatOpenAI({
        modelName: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: 0.7,
        openAIApiKey: apiKey,
        maxTokens: 500,
      });
    }
    // At this point, llm is guaranteed to be non-null
    return this.llm!;
  }

  /**
   * Get or create memory for a conversation
   * Memory is keyed by conversationKey (typically businessId+customerId)
   */
  getOrCreateMemory(conversationKey: string): InMemoryChatMessageHistory {
    if (!this.memories.has(conversationKey)) {
      this.memories.set(conversationKey, new InMemoryChatMessageHistory());
    }
    return this.memories.get(conversationKey)!;
  }

  /**
   * Clear memory for a conversation
   */
  clearMemory(conversationKey: string): void {
    this.memories.delete(conversationKey);
    this.logger.log(`Cleared memory for conversation: ${conversationKey}`);
  }

  /**
   * Get all conversation keys (for debugging)
   */
  getConversationKeys(): string[] {
    return Array.from(this.memories.keys());
  }
}

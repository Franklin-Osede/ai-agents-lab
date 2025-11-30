import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
import { LangChainProvider } from '../../../../core/infrastructure/ai/langchain.provider';
import { CheckAvailabilityTool } from '../tools/check-availability.tool';
import { SuggestTimesTool } from '../tools/suggest-times.tool';
import { ConfirmBookingTool } from '../tools/confirm-booking.tool';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

/**
 * BookingAgentChainService
 *
 * LangChain-based agent chain for booking agent with tools and memory.
 * Uses ReAct agent pattern for reasoning and acting.
 */
@Injectable()
export class BookingAgentChainService {
  private readonly logger = new Logger(BookingAgentChainService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private agentExecutor: any = null;
  private readonly memories: Map<string, InMemoryChatMessageHistory> = new Map();

  constructor(
    private readonly langChainProvider: LangChainProvider,
    private readonly checkAvailabilityTool: CheckAvailabilityTool,
    private readonly suggestTimesTool: SuggestTimesTool,
    private readonly confirmBookingTool: ConfirmBookingTool,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initialize the agent executor with tools
   * Called lazily on first use
   */
  private async initializeAgent(): Promise<void> {
    if (this.agentExecutor) {
      return;
    }

    try {
      const llm = this.langChainProvider.getLLM();
      const tools = [
        this.checkAvailabilityTool.getTool(),
        this.suggestTimesTool.getTool(),
        this.confirmBookingTool.getTool(),
      ];

      // Simple system prompt for createReactAgent (it handles the conversation flow automatically)
      const systemPrompt = `You are a professional booking assistant for a business.
Your role is to help customers book appointments in a friendly and efficient manner.

You have access to these tools:
- check_availability: Check available time slots for a specific date
- suggest_times: Suggest best available times based on customer preferences
- confirm_booking: Confirm a booking when the customer agrees

Guidelines:
1. Always be friendly, professional, and helpful
2. When customer asks about availability, use check_availability tool
3. When suggesting times, use suggest_times tool with customer preferences
4. When customer confirms a booking, use confirm_booking tool
5. Always confirm details before finalizing a booking
6. If a tool fails, apologize and offer alternatives
7. Keep responses concise (2-3 sentences max)
8. Use the customer's preferred language (Spanish/English)

Remember previous conversation context to provide personalized service.`;

      this.agentExecutor = await createReactAgent({
        llm,
        tools,
        prompt: systemPrompt,
      });

      this.logger.log('BookingAgentChain initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize agent: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Process a booking request using LangChain agent with tools
   *
   * @param message - User message
   * @param context - Context including businessId, customerId, etc.
   * @returns Agent response
   */
  async processRequest(
    message: string,
    context: {
      businessId: string;
      customerId?: string;
      businessType?: string;
      [key: string]: unknown;
    },
  ): Promise<string> {
    try {
      await this.initializeAgent();

      if (!this.agentExecutor) {
        this.logger.error('Agent executor not initialized');
        throw new Error('Agent executor not initialized');
      }

      // Get or create memory for this conversation
      const conversationKey = `${context.businessId}_${context.customerId || 'anonymous'}`;
      const memory = this.getOrCreateMemory(conversationKey);

      // Load conversation history
      const historyMessages = await memory.getMessages();
      const { HumanMessage } = await import('@langchain/core/messages');

      // Build messages array for the agent
      const messages = [...historyMessages, new HumanMessage(message)];

      // Invoke agent (createReactAgent returns a CompiledStateGraph)
      const result = await this.agentExecutor.invoke({
        messages,
      });

      // Extract the last AI message from the result
      const resultMessages = result.messages || [];
      const lastAIMessage = resultMessages
        .slice()
        .reverse()
        .find((msg: { _getType: () => string }) => msg._getType() === 'ai');
      const response =
        lastAIMessage?.content || result.output || 'Lo siento, no pude procesar tu solicitud.';

      // Save to memory
      await memory.addUserMessage(message);
      await memory.addAIMessage(response);

      this.logger.log(`Agent processed request successfully for conversation: ${conversationKey}`);

      return response;
    } catch (error) {
      this.logger.error(
        `Error processing request: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Return friendly error message with more details in dev
      const errorMessage = (error as Error).message || 'Unknown error';
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        return `Error: ${errorMessage}. Por favor, verifica los logs del servidor.`;
      }
      return 'Lo siento, hubo un problema procesando tu solicitud. Por favor, intenta de nuevo o contacta con soporte.';
    }
  }

  /**
   * Get or create memory for a conversation
   */
  private getOrCreateMemory(conversationKey: string): InMemoryChatMessageHistory {
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
}

import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import {
  BookingEntities,
  BookingEntitiesSchema,
  BookingEntitiesInput,
} from '../../domain/value-objects/booking-entities';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';

/**
 * EntityExtractorService
 * 
 * Application Service responsible for extracting booking entities from user messages.
 * Uses LangChain StructuredOutputParser with Zod schema for robust extraction.
 * Follows Single Responsibility Principle - only handles entity extraction.
 */
@Injectable()
export class EntityExtractorService {
  private readonly logger = new Logger(EntityExtractorService.name);
  private readonly parser: StructuredOutputParser<typeof BookingEntitiesSchema>;
  private readonly llm: ChatOpenAI | null = null;

  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: IAiProvider,
    private readonly configService: ConfigService,
  ) {
    // Initialize parser with Zod schema
    this.parser = StructuredOutputParser.fromZodSchema(BookingEntitiesSchema);

    // If using LangChainProvider, get the LLM directly for better structured output
    if (this.configService.get<string>('AI_PROVIDER', 'openai').toLowerCase() === 'langchain') {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (apiKey) {
        this.llm = new ChatOpenAI({
          modelName: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4-turbo-preview',
          temperature: 0.3, // Lower temperature for more consistent extraction
          openAIApiKey: apiKey,
        });
      }
    }
  }

  /**
   * Extract booking entities from a user message
   * Uses LangChain StructuredOutputParser if available, otherwise falls back to JSON parsing
   * 
   * @param message - User message to extract entities from
   * @returns Result containing BookingEntities or empty entities on failure
   */
  async extractEntities(message: string): Promise<Result<BookingEntities>> {
    try {
      // Use LangChain StructuredOutputParser if LLM is available
      if (this.llm) {
        return await this.extractWithStructuredParser(message);
      }

      // Fallback to original JSON parsing method
      return await this.extractWithJsonParsing(message);
    } catch (error) {
      this.logger.warn(`Failed to extract entities: ${(error as Error).message}`);
      // Return empty entities instead of failing - graceful degradation
      return BookingEntities.create({});
    }
  }

  /**
   * Extract entities using LangChain StructuredOutputParser
   * More robust and validated extraction
   */
  private async extractWithStructuredParser(message: string): Promise<Result<BookingEntities>> {
    try {
      const formatInstructions = this.parser.getFormatInstructions();

      const systemPrompt = `You are an expert at extracting booking information from customer messages.
Extract dates, times, services, location, and number of people from the message.
Normalize dates to YYYY-MM-DD format (e.g., "mañana" → tomorrow's date).
Normalize times to HH:mm format (e.g., "2pm" → "14:00").
${formatInstructions}`;

      const userPrompt = `Extract booking entities from: "${message}"`;

      const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];

      const response = await this.llm!.invoke(messages);
      const parsed = await this.parser.parse(response.content as string);

      // Normalize dates and times
      const normalized = this.normalizeEntities(parsed);

      return BookingEntities.create(normalized);
    } catch (error) {
      this.logger.warn(
        `Structured parser failed: ${(error as Error).message}, falling back to JSON parsing`,
      );
      return await this.extractWithJsonParsing(message);
    }
  }

  /**
   * Extract entities using original JSON parsing method (fallback)
   */
  private async extractWithJsonParsing(message: string): Promise<Result<BookingEntities>> {
    const prompt = this.buildExtractionPrompt(message);
    const response = await this.aiProvider.generateResponse(prompt, {
      temperature: 0.3,
      maxTokens: 200,
    });

    return this.parseEntities(response);
  }

  /**
   * Normalize extracted entities (dates, times, etc.)
   */
  private normalizeEntities(parsed: BookingEntitiesInput): Partial<BookingEntities> {
    const normalized: Partial<BookingEntities> = {
      dates: [],
      times: [],
      services: parsed.services || [],
      location: parsed.location,
      people: parsed.people,
    };

    // Normalize dates (handle relative dates like "mañana", "hoy")
    if (parsed.dates && Array.isArray(parsed.dates)) {
      normalized.dates = parsed.dates.map((date: string) => {
        // If already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date;
        }
        // Otherwise, try to parse relative dates
        return this.normalizeDate(date);
      });
    }

    // Normalize times (handle formats like "2pm", "14:00", etc.)
    if (parsed.times && Array.isArray(parsed.times)) {
      normalized.times = parsed.times.map((time: string) => {
        // If already in HH:mm format, return as is
        if (/^\d{2}:\d{2}$/.test(time)) {
          return time;
        }
        // Otherwise, normalize
        return this.normalizeTime(time);
      });
    }

    return normalized;
  }

  /**
   * Normalize date string to YYYY-MM-DD format
   */
  private normalizeDate(dateStr: string): string {
    const lower = dateStr.toLowerCase().trim();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (lower.includes('mañana') || lower.includes('tomorrow')) {
      return tomorrow.toISOString().split('T')[0];
    }
    if (lower.includes('hoy') || lower.includes('today')) {
      return today.toISOString().split('T')[0];
    }

    // Try to parse as date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    // Return as is if can't normalize
    return dateStr;
  }

  /**
   * Normalize time string to HH:mm format
   */
  private normalizeTime(timeStr: string): string {
    const lower = timeStr.toLowerCase().trim();

    // Handle formats like "2pm", "2:30pm", "14:00"
    const pmMatch = lower.match(/(\d{1,2}):?(\d{2})?\s*pm/);
    const amMatch = lower.match(/(\d{1,2}):?(\d{2})?\s*am/);

    if (pmMatch) {
      const hours = parseInt(pmMatch[1]);
      const minutes = pmMatch[2] ? parseInt(pmMatch[2]) : 0;
      const hour24 = hours === 12 ? 12 : hours + 12;
      return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    if (amMatch) {
      const hours = parseInt(amMatch[1]);
      const minutes = amMatch[2] ? parseInt(amMatch[2]) : 0;
      const hour24 = hours === 12 ? 0 : hours;
      return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Try to parse as HH:mm
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Return as is if can't normalize
    return timeStr;
  }

  /**
   * Build the prompt for entity extraction
   * Private method following Single Responsibility
   */
  private buildExtractionPrompt(message: string): string {
    return `Extract booking entities from the following message: "${message}"

Return ONLY a valid JSON object with this structure:
{
  "dates": ["array of dates in YYYY-MM-DD format"],
  "times": ["array of times in HH:mm format"],
  "services": ["array of service names"],
  "location": "location name if mentioned",
  "people": number of people if mentioned
}

If an entity is not found, use empty array [] or omit the field.
Examples:
- "mañana" → dates: ["2024-01-15"]
- "2pm" → times: ["14:00"]
- "botox" → services: ["botox"]
- "para 2 personas" → people: 2

JSON response:`;
  }

  /**
   * Parse AI response into BookingEntities
   * Handles JSON parsing errors gracefully
   */
  private parseEntities(response: string): Result<BookingEntities> {
    try {
      // Try to extract JSON from response (in case AI adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;

      const parsed = JSON.parse(jsonString);

      // Validate and create entities
      return BookingEntities.create({
        dates: Array.isArray(parsed.dates) ? parsed.dates : [],
        times: Array.isArray(parsed.times) ? parsed.times : [],
        services: Array.isArray(parsed.services) ? parsed.services : [],
        location: parsed.location || undefined,
        people: typeof parsed.people === 'number' ? parsed.people : undefined,
      });
    } catch (error) {
      this.logger.warn(`Failed to parse entities from response: ${(error as Error).message}`);
      // Return empty entities on parse error - graceful degradation
      return BookingEntities.create({});
    }
  }
}

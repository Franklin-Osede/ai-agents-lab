import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import { BookingEntities } from '../../domain/value-objects/booking-entities';
import { Result } from '../../../../core/domain/shared/value-objects/result';

/**
 * EntityExtractorService
 * 
 * Application Service responsible for extracting booking entities from user messages.
 * Follows Single Responsibility Principle - only handles entity extraction.
 * Uses AI Provider abstraction (Dependency Inversion).
 */
@Injectable()
export class EntityExtractorService {
  private readonly logger = new Logger(EntityExtractorService.name);

  constructor(@Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: IAiProvider) {}

  /**
   * Extract booking entities from a user message
   * 
   * @param message - User message to extract entities from
   * @returns Result containing BookingEntities or empty entities on failure
   */
  async extractEntities(message: string): Promise<Result<BookingEntities>> {
    try {
      const prompt = this.buildExtractionPrompt(message);
      const response = await this.aiProvider.generateResponse(prompt, {
        temperature: 0.3, // Lower temperature for more consistent extraction
        maxTokens: 200,
      });

      return this.parseEntities(response);
    } catch (error) {
      this.logger.warn(`Failed to extract entities: ${error.message}`);
      // Return empty entities instead of failing - graceful degradation
      return BookingEntities.create({});
    }
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
      this.logger.warn(`Failed to parse entities from response: ${error.message}`);
      // Return empty entities on parse error - graceful degradation
      return BookingEntities.create({});
    }
  }
}


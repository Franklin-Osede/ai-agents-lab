import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../../domain/interfaces/booking-repository.interface';
import { IntentClassifierService } from '../../../../shared/services/intent-classifier.service';
import {
  AgentIntent,
  IntentType,
} from '../../../../core/domain/agents/entities/agent-intent.entity';
import { AiProviderException } from '../../../../core/shared/exceptions/business.exception';
import { EntityExtractorService } from './entity-extractor.service';
import { BookingEntities } from '../../domain/value-objects/booking-entities';

export interface BookingRequest {
  message: string;
  customerId?: string;
  businessId: string;
  context?: Record<string, unknown>;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  suggestedTimes?: string[];
  bookingId?: string;
  intent: {
    type: string;
    confidence: number;
  };
  entities?: {
    dates: string[];
    times: string[];
    services: string[];
    location?: string;
    people?: number;
  };
}

@Injectable()
export class BookingAgentService {
  private readonly logger = new Logger(BookingAgentService.name);

  constructor(
    private readonly intentClassifier: IntentClassifierService,
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: IAiProvider,
    @Inject('IBookingRepository') private readonly bookingRepository?: IBookingRepository,
    private readonly entityExtractor?: EntityExtractorService,
  ) {}

  async processBookingRequest(request: BookingRequest): Promise<Result<BookingResponse>> {
    try {
      this.logger.log(`Processing booking request for business: ${request.businessId}`);

      const intent = await this.intentClassifier.classify(request.message);

      if (intent.type !== IntentType.BOOKING && intent.confidence < 0.7) {
        this.logger.warn(`Low confidence booking intent: ${intent.type} (${intent.confidence})`);
        return Result.ok({
          success: false,
          message: await this.generateClarificationResponse(request.message),
          intent: {
            type: intent.type,
            confidence: intent.confidence,
          },
        });
      }

      // Extract entities from message
      const entitiesResult = this.entityExtractor
        ? await this.entityExtractor.extractEntities(request.message)
        : BookingEntities.create({});
      const entities = entitiesResult.isSuccess ? entitiesResult.value : BookingEntities.create({}).value;

      const suggestedTimes = await this.extractAvailableTimes(request.businessId, intent);
      const responseMessage = await this.generateBookingResponse(
        request.message,
        suggestedTimes,
        request.context,
      );

      const bookingId = this.generateBookingId();

      this.logger.log(`Booking request processed successfully: ${bookingId}`);

      return Result.ok({
        success: true,
        message: responseMessage,
        suggestedTimes,
        bookingId,
        intent: {
          type: intent.type,
          confidence: intent.confidence,
        },
        entities: entities.hasEntities() ? entities.toPlainObject() : undefined,
      });
    } catch (error) {
      this.logger.error(`Error processing booking request: ${error.message}`, error.stack);
      if (error instanceof AiProviderException) {
        return Result.fail(error);
      }
      return Result.fail(
        new AiProviderException('Failed to process booking request', error as Error),
      );
    }
  }

  async confirmBooking(bookingId: string, selectedTime: string): Promise<Result<Booking>> {
    try {
      this.logger.log(`Confirming booking: ${bookingId} at ${selectedTime}`);

      // In real implementation, this would create and save the booking
      const booking = new Booking('customer-id', 'business-id', new Date(selectedTime));
      booking.confirm();

      if (this.bookingRepository) {
        await this.bookingRepository.save(booking);
      }

      this.logger.log(`Booking confirmed: ${bookingId}`);
      return Result.ok(booking);
    } catch (error) {
      this.logger.error(`Error confirming booking: ${error.message}`, error.stack);
      return Result.fail(error as Error);
    }
  }

  private async generateBookingResponse(
    userMessage: string,
    availableTimes: string[],
    context?: Record<string, unknown>,
  ): Promise<string> {
    const systemPrompt = `You are a professional booking assistant for a ${context?.businessType || 'business'}.
Your role is to help customers book appointments in a friendly and efficient manner.
Always suggest specific available times and confirm the booking details.`;

    const userPrompt = `Customer message: "${userMessage}"
Available times: ${availableTimes.join(', ')}

Generate a friendly response that:
1. Acknowledges their booking request
2. Suggests 2-3 available times
3. Asks for confirmation

Keep it concise (2-3 sentences max).`;

    try {
      return await this.aiProvider.generateResponse(userPrompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 150,
      });
    } catch (error) {
      this.logger.error(`AI provider error: ${error.message}`);
      throw new AiProviderException('Failed to generate booking response', error as Error);
    }
  }

  private async generateClarificationResponse(message: string): Promise<string> {
    const prompt = `The customer said: "${message}"
This doesn't seem to be a booking request. Generate a friendly response that:
1. Acknowledges their message
2. Asks if they'd like to book an appointment
3. Offers to help with other questions

Keep it brief and friendly.`;

    try {
      return await this.aiProvider.generateResponse(prompt, {
        temperature: 0.7,
        maxTokens: 100,
      });
    } catch (error) {
      this.logger.error(`AI provider error: ${error.message}`);
      return 'Thank you for your message! Would you like to book an appointment?';
    }
  }

  private async extractAvailableTimes(businessId: string, intent: AgentIntent): Promise<string[]> {
    // Try to get from repository if available
    if (this.bookingRepository) {
      try {
        const slots = await this.bookingRepository.findAvailableSlots(businessId, new Date());
        if (slots.length > 0) {
          return slots.slice(0, 3);
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch available slots: ${error.message}`);
        // Fallback to default times
      }
    }

    // Default available times
    const defaultTimes = ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    if (intent.entities.times && intent.entities.times.length > 0) {
      return intent.entities.times.slice(0, 3);
    }

    return defaultTimes.slice(0, 3);
  }

  private generateBookingId(): string {
    return `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

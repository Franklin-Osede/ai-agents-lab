import { Test, TestingModule } from '@nestjs/testing';
import { BookingAgentService } from './booking-agent.service';
import { IntentClassifierService } from '../../../../shared/services/intent-classifier.service';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import {
  AgentIntent,
  IntentType,
} from '../../../../core/domain/agents/entities/agent-intent.entity';
import { AiProviderException } from '../../../../core/shared/exceptions/business.exception';
import { Booking } from '../../domain/entities/booking.entity';

describe('BookingAgentService', () => {
  let service: BookingAgentService;
  let intentClassifier: IntentClassifierService;
  let aiProvider: IAiProvider;

  const mockAiProvider: IAiProvider = {
    generateResponse: jest.fn(),
    classifyIntent: jest.fn(),
  };

  const mockBookingRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByCustomerId: jest.fn(),
    findByBusinessId: jest.fn(),
    findAvailableSlots: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingAgentService,
        IntentClassifierService,
        {
          provide: AI_PROVIDER_TOKEN,
          useValue: mockAiProvider,
        },
        {
          provide: 'IBookingRepository',
          useValue: mockBookingRepository,
        },
      ],
    })
      .overrideProvider(IntentClassifierService)
      .useValue({
        classify: jest.fn(),
      })
      .compile();

    service = module.get<BookingAgentService>(BookingAgentService);
    intentClassifier = module.get<IntentClassifierService>(IntentClassifierService);
    aiProvider = module.get<IAiProvider>(AI_PROVIDER_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processBookingRequest', () => {
    it('should successfully process a booking request with high confidence', async () => {
      // Arrange
      const request = {
        message: 'I want to book an appointment for tomorrow at 2pm',
        customerId: 'customer-123',
        businessId: 'business-456',
      };

      const mockIntent = new AgentIntent(IntentType.BOOKING, 0.9, request.message, {
        times: ['14:00'],
        dates: ['tomorrow'],
      });

      jest.spyOn(intentClassifier, 'classify').mockResolvedValue(mockIntent);
      jest
        .spyOn(aiProvider, 'generateResponse')
        .mockResolvedValue(
          'Great! I have availability tomorrow at 2:00 PM. Would that work for you?',
        );

      // Act
      const result = await service.processBookingRequest(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.success).toBe(true);
      expect(result.value.suggestedTimes).toBeDefined();
      expect(result.value.bookingId).toBeDefined();
      expect(result.value.intent.type).toBe(IntentType.BOOKING);
      expect(result.value.intent.confidence).toBe(0.9);
      expect(intentClassifier.classify).toHaveBeenCalledWith(request.message);
    });

    it('should handle non-booking intents with low confidence', async () => {
      // Arrange
      const request = {
        message: 'What is your address?',
        businessId: 'business-456',
      };

      const mockIntent = new AgentIntent(IntentType.INFORMATION, 0.5, request.message);

      jest.spyOn(intentClassifier, 'classify').mockResolvedValue(mockIntent);
      jest
        .spyOn(aiProvider, 'generateResponse')
        .mockResolvedValue('I can help you with that! Would you like to book an appointment?');

      // Act
      const result = await service.processBookingRequest(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.success).toBe(false);
      expect(result.value.message).toContain('help');
      expect(result.value.intent.type).toBe(IntentType.INFORMATION);
    });

    it('should extract available times from repository when available', async () => {
      // Arrange
      const request = {
        message: 'Book appointment',
        businessId: 'business-456',
      };

      const mockIntent = new AgentIntent(IntentType.BOOKING, 0.9, request.message);
      const availableSlots = ['10:00', '11:00', '14:00'];

      jest.spyOn(intentClassifier, 'classify').mockResolvedValue(mockIntent);
      jest.spyOn(mockBookingRepository, 'findAvailableSlots').mockResolvedValue(availableSlots);
      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue('Response');

      // Act
      const result = await service.processBookingRequest(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockBookingRepository.findAvailableSlots).toHaveBeenCalled();
      expect(result.value.suggestedTimes).toEqual(availableSlots.slice(0, 3));
    });

    it('should use default times when repository is not available', async () => {
      // Arrange
      const request = {
        message: 'Book appointment',
        businessId: 'business-456',
      };

      const mockIntent = new AgentIntent(IntentType.BOOKING, 0.9, request.message);

      jest.spyOn(intentClassifier, 'classify').mockResolvedValue(mockIntent);
      jest
        .spyOn(mockBookingRepository, 'findAvailableSlots')
        .mockRejectedValue(new Error('Repository error'));
      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue('Response');

      // Act
      const result = await service.processBookingRequest(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.suggestedTimes).toBeDefined();
      expect(result.value.suggestedTimes?.length).toBeGreaterThan(0);
    });

    it('should return failure result on AI provider error', async () => {
      // Arrange
      const request = {
        message: 'Book appointment',
        businessId: 'business-456',
      };

      const mockIntent = new AgentIntent(IntentType.BOOKING, 0.9, request.message);

      jest.spyOn(intentClassifier, 'classify').mockResolvedValue(mockIntent);
      jest.spyOn(aiProvider, 'generateResponse').mockRejectedValue(new Error('AI Provider Error'));

      // Act
      const result = await service.processBookingRequest(request);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(AiProviderException);
    });

    it('should return failure result on intent classification error', async () => {
      // Arrange
      const request = {
        message: 'Book appointment',
        businessId: 'business-456',
      };

      jest.spyOn(intentClassifier, 'classify').mockRejectedValue(new Error('Classification Error'));

      // Act
      const result = await service.processBookingRequest(request);

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('confirmBooking', () => {
    it('should successfully confirm a booking', async () => {
      // Arrange
      const bookingId = 'BK-123';
      const selectedTime = '2024-01-15T14:00:00Z';

      jest.spyOn(mockBookingRepository, 'save').mockResolvedValue({
        id: bookingId,
        customerId: 'customer-123',
        businessId: 'business-456',
        scheduledTime: new Date(selectedTime),
        status: 'CONFIRMED',
      } as Booking);

      // Act
      const result = await service.confirmBooking(bookingId, selectedTime);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
    });

    it('should handle repository errors when confirming booking', async () => {
      // Arrange
      const bookingId = 'BK-123';
      const selectedTime = '2024-01-15T14:00:00Z';

      jest.spyOn(mockBookingRepository, 'save').mockRejectedValue(new Error('Repository Error'));

      // Act
      const result = await service.confirmBooking(bookingId, selectedTime);

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });
});

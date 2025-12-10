import { Test, TestingModule } from '@nestjs/testing';
import { BookingAgentController } from './booking-agent.controller';
import { BookingAgentService } from '../application/services/booking-agent.service';
import { BookingAgentChainService } from '../application/services/booking-agent-chain.service';
import { Result } from '@core/domain/shared/value-objects/result';
import { IntentType } from '@core/domain/agents/entities/agent-intent.entity';

describe('BookingAgentController', () => {
  let controller: BookingAgentController;
  let service: BookingAgentService;
  let chainService: BookingAgentChainService;

  const mockService = {
    processBookingRequest: jest.fn(),
    confirmBooking: jest.fn(),
  };

  const mockChainService = {
    processRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingAgentController],
      providers: [
        {
          provide: BookingAgentService,
          useValue: mockService,
        },
        {
          provide: BookingAgentChainService,
          useValue: mockChainService,
        },
      ],
    }).compile();

    controller = module.get<BookingAgentController>(BookingAgentController);
    service = module.get<BookingAgentService>(BookingAgentService);
    chainService = module.get<BookingAgentChainService>(BookingAgentChainService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chat', () => {
    it('should return chat response from chain service', async () => {
      const body = {
        message: 'Hello',
        sessionId: 'session-1',
        businessId: 'business-1',
      };
      const expectedResponse = 'Hello! How can I help?';
      mockChainService.processRequest.mockResolvedValue(expectedResponse);

      const result = await controller.chat(body);

      expect(result).toEqual({ response: expectedResponse });
      expect(mockChainService.processRequest).toHaveBeenCalledWith(
        body.message,
        expect.objectContaining({
          businessId: body.businessId,
          customerId: body.sessionId,
        }),
      );
      // Use chainService to satisfy linter if needed, or just keep it for completeness
      expect(chainService).toBeDefined();
    });
  });

  describe('processBooking', () => {
    it('should successfully process a booking request', async () => {
      // Arrange
      const dto = {
        message: 'I want to book an appointment',
        businessId: 'business-123',
        customerId: 'customer-456',
        context: {},
      };

      const expectedResponse = {
        success: true,
        message: 'Great! I have availability...',
        suggestedTimes: ['10:00', '11:00', '14:00'],
        bookingId: 'BK-123',
        intent: {
          type: IntentType.BOOKING,
          confidence: 0.9,
        },
      };

      jest.spyOn(service, 'processBookingRequest').mockResolvedValue(Result.ok(expectedResponse));

      // Act
      const result = await controller.processBooking(dto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.processBookingRequest).toHaveBeenCalledWith({
        message: dto.message,
        customerId: dto.customerId,
        businessId: dto.businessId,
        context: dto.context,
      });
    });

    it('should return error response when service fails', async () => {
      // Arrange
      const dto = {
        message: 'Book appointment',
        businessId: 'business-123',
        customerId: 'customer-456',
        context: {},
      };

      jest
        .spyOn(service, 'processBookingRequest')
        .mockResolvedValue(Result.fail(new Error('Service error')));

      // Act
      const result = await controller.processBooking(dto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred processing your request');
      expect(result.intent).toBeDefined();
      if (result.intent) {
        expect(result.intent.type).toBe('UNKNOWN');
        expect(result.intent.confidence).toBe(0);
      }
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { FollowUpAgentController } from './follow-up-agent.controller';
import { FollowUpAgentService } from '../application/services/follow-up-agent.service';
import { Result } from '@core/domain/shared/value-objects/result';
import { FollowUpUrgency } from '../domain/entities/follow-up.entity';

describe('FollowUpAgentController', () => {
  let controller: FollowUpAgentController;
  let service: FollowUpAgentService;

  const mockService = {
    generateFollowUp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowUpAgentController],
      providers: [
        {
          provide: FollowUpAgentService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FollowUpAgentController>(FollowUpAgentController);
    service = module.get<FollowUpAgentService>(FollowUpAgentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFollowUp', () => {
    it('should successfully generate follow-up message', async () => {
      // Arrange
      const dto = {
        customerId: 'customer-123',
        businessId: 'business-456',
        lastInteraction: 'Interested in botox',
        daysSinceLastContact: 5,
        previousIntent: 'PRICE_QUERY',
      };

      const expectedResponse = {
        success: true,
        message: 'Hi! I wanted to follow up...',
        urgency: FollowUpUrgency.HIGH,
        suggestedNextSteps: ['Send follow-up message', 'Wait for response'],
      };

      jest.spyOn(service, 'generateFollowUp').mockResolvedValue(Result.ok(expectedResponse));

      // Act
      const result = await controller.generateFollowUp(dto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.generateFollowUp).toHaveBeenCalledWith({
        customerId: dto.customerId,
        businessId: dto.businessId,
        lastInteraction: dto.lastInteraction,
        daysSinceLastContact: dto.daysSinceLastContact,
        previousIntent: dto.previousIntent,
        context: undefined,
      });
    });

    it('should return error response when service fails', async () => {
      // Arrange
      const dto = {
        customerId: 'customer-123',
        businessId: 'business-456',
        lastInteraction: 'Hello',
        daysSinceLastContact: 1,
      };

      jest
        .spyOn(service, 'generateFollowUp')
        .mockResolvedValue(Result.fail(new Error('Service error')));

      // Act
      const result = await controller.generateFollowUp(dto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error generating follow-up message');
      expect(result.urgency).toBe('LOW');
      expect(result.suggestedNextSteps).toEqual([]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { FollowUpAgentService } from './follow-up-agent.service';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import { FollowUpUrgency } from '../../domain/entities/follow-up.entity';

describe('FollowUpAgentService', () => {
  let service: FollowUpAgentService;
  let aiProvider: IAiProvider;

  const mockAiProvider: IAiProvider = {
    generateResponse: jest.fn(),
    classifyIntent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUpAgentService,
        {
          provide: AI_PROVIDER_TOKEN,
          useValue: mockAiProvider,
        },
        {
          provide: 'IFollowUpRepository',
          useValue: null,
        },
      ],
    }).compile();

    service = module.get<FollowUpAgentService>(FollowUpAgentService);
    aiProvider = module.get<IAiProvider>(AI_PROVIDER_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFollowUp', () => {
    it('should generate follow-up message with correct urgency', async () => {
      // Arrange
      const request = {
        customerId: 'customer-123',
        businessId: 'business-456',
        lastInteraction: 'Interested in botox treatment',
        daysSinceLastContact: 5,
        previousIntent: 'PRICE_QUERY',
      };

      jest
        .spyOn(aiProvider, 'generateResponse')
        .mockResolvedValue(
          'Hi! I wanted to follow up on your interest in botox. We have a special offer this week!',
        );

      // Act
      const result = await service.generateFollowUp(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.urgency).toBe(FollowUpUrgency.HIGH);
      expect(result.value.message).toBeDefined();
      expect(result.value.suggestedNextSteps.length).toBeGreaterThan(0);
    });

    it('should calculate LOW urgency for recent contacts', async () => {
      // Arrange
      const request = {
        customerId: 'customer-123',
        businessId: 'business-456',
        lastInteraction: 'Booked consultation',
        daysSinceLastContact: 0,
      };

      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue('Follow-up message');

      // Act
      const result = await service.generateFollowUp(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.urgency).toBe(FollowUpUrgency.LOW);
    });
  });
});

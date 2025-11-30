import { Test, TestingModule } from '@nestjs/testing';
import { DmResponseAgentService } from './dm-response-agent.service';
import { IntentClassifierService } from '../../../../shared/services/intent-classifier.service';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import {
  AgentIntent,
  IntentType,
} from '../../../../core/domain/agents/entities/agent-intent.entity';
import { MessageChannel } from '../../domain/entities/message.entity';

describe('DmResponseAgentService', () => {
  let service: DmResponseAgentService;
  let intentClassifier: IntentClassifierService;
  let aiProvider: IAiProvider;

  const mockAiProvider: IAiProvider = {
    generateResponse: jest.fn(),
    classifyIntent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DmResponseAgentService,
        IntentClassifierService,
        {
          provide: AI_PROVIDER_TOKEN,
          useValue: mockAiProvider,
        },
        {
          provide: 'IMessageRepository',
          useValue: null,
        },
      ],
    })
      .overrideProvider(IntentClassifierService)
      .useValue({
        classify: jest.fn(),
      })
      .compile();

    service = module.get<DmResponseAgentService>(DmResponseAgentService);
    intentClassifier = module.get<IntentClassifierService>(IntentClassifierService);
    aiProvider = module.get<IAiProvider>(AI_PROVIDER_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processDm', () => {
    it('should successfully process a DM and generate response', async () => {
      // Arrange
      const request = {
        message: 'How much does a botox treatment cost?',
        customerId: 'customer-123',
        businessId: 'business-456',
        channel: MessageChannel.INSTAGRAM,
      };

      const mockIntent = new AgentIntent(IntentType.PRICE_QUERY, 0.9, request.message);

      jest.spyOn(intentClassifier, 'classify').mockResolvedValue(mockIntent);
      jest
        .spyOn(aiProvider, 'generateResponse')
        .mockResolvedValue(
          'Our botox treatments start at €200. Would you like to schedule a consultation?',
        );

      // Act
      const result = await service.processDm(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.success).toBe(true);
      expect(result.value.response).toBeDefined();
      expect(result.value.suggestedActions).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const request = {
        message: 'Hello',
        customerId: 'customer-123',
        businessId: 'business-456',
        channel: MessageChannel.WHATSAPP,
      };

      jest.spyOn(intentClassifier, 'classify').mockRejectedValue(new Error('AI Error'));

      // Act
      const result = await service.processDm(request);

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });
});

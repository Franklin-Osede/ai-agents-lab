import { Test, TestingModule } from '@nestjs/testing';
import { DmResponseAgentController } from './dm-response-agent.controller';
import { DmResponseAgentService } from '../application/services/dm-response-agent.service';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import { MessageChannel } from '../domain/entities/message.entity';
import { IntentType } from '../../../../core/domain/agents/entities/agent-intent.entity';

describe('DmResponseAgentController', () => {
  let controller: DmResponseAgentController;
  let service: DmResponseAgentService;

  const mockService = {
    processDm: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DmResponseAgentController],
      providers: [
        {
          provide: DmResponseAgentService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DmResponseAgentController>(DmResponseAgentController);
    service = module.get<DmResponseAgentService>(DmResponseAgentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processDm', () => {
    it('should successfully process a DM', async () => {
      // Arrange
      const dto = {
        message: 'How much does botox cost?',
        customerId: 'customer-123',
        businessId: 'business-456',
        channel: MessageChannel.INSTAGRAM,
      };

      const expectedResponse = {
        success: true,
        response: 'Our botox treatments start at €200.',
        intent: {
          type: IntentType.PRICE_QUERY,
          confidence: 0.9,
        },
        suggestedActions: ['View pricing', 'Request quote'],
      };

      jest.spyOn(service, 'processDm').mockResolvedValue(Result.ok(expectedResponse));

      // Act
      const result = await controller.processDm(dto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.processDm).toHaveBeenCalledWith({
        message: dto.message,
        customerId: dto.customerId,
        businessId: dto.businessId,
        channel: dto.channel,
        context: undefined,
      });
    });

    it('should return error response when service fails', async () => {
      // Arrange
      const dto = {
        message: 'Hello',
        customerId: 'customer-123',
        businessId: 'business-456',
        channel: MessageChannel.WHATSAPP,
      };

      jest.spyOn(service, 'processDm').mockResolvedValue(Result.fail(new Error('Service error')));

      // Act
      const result = await controller.processDm(dto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.response).toBe('Sorry, I encountered an error. Please try again.');
      expect(result.intent.type).toBe('UNKNOWN');
      expect(result.intent.confidence).toBe(0);
    });
  });
});

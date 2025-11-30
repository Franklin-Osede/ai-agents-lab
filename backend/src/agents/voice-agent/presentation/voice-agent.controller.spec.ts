import { Test, TestingModule } from '@nestjs/testing';
import { VoiceAgentController } from './voice-agent.controller';
import { VoiceAgentService } from '../application/services/voice-agent.service';
import { Result } from '../../../core/domain/shared/value-objects/result';
import { VoiceMessage, VoiceChannel } from '../domain/value-objects/voice-message';

describe('VoiceAgentController', () => {
  let controller: VoiceAgentController;
  let service: VoiceAgentService;

  const mockService = {
    generateVoiceMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoiceAgentController],
      providers: [
        {
          provide: VoiceAgentService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<VoiceAgentController>(VoiceAgentController);
    service = module.get<VoiceAgentService>(VoiceAgentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateVoice', () => {
    it('should successfully generate voice message', async () => {
      // Arrange
      const dto = {
        customerId: 'customer-123',
        businessId: 'business-456',
        context: 'Cliente consultó sobre botox hace 3 días',
        channel: VoiceChannel.WHATSAPP,
        includeVideo: false,
      };

      const mockVoiceMessage = VoiceMessage.create({
        script: 'Hola María, te escribo para seguir con tu consulta sobre botox.',
        audioUrl: 'https://example.com/audio.mp3',
        duration: 30,
        channel: VoiceChannel.WHATSAPP,
      }).value;

      jest.spyOn(service, 'generateVoiceMessage').mockResolvedValue(Result.ok(mockVoiceMessage));

      // Act
      const result = await controller.generateVoice(dto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.script).toBe(mockVoiceMessage.script);
      expect(result.audioUrl).toBe(mockVoiceMessage.audioUrl);
      expect(service.generateVoiceMessage).toHaveBeenCalledWith({
        customerId: dto.customerId,
        businessId: dto.businessId,
        context: dto.context,
        channel: dto.channel,
        includeVideo: dto.includeVideo,
      });
    });

    it('should return error response when service fails', async () => {
      // Arrange
      const dto = {
        customerId: 'customer-123',
        businessId: 'business-456',
        context: 'Test context',
        channel: VoiceChannel.WHATSAPP,
      };

      jest
        .spyOn(service, 'generateVoiceMessage')
        .mockResolvedValue(Result.fail(new Error('Service error')));

      // Act
      const result = await controller.generateVoice(dto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should include video URL when video is generated', async () => {
      // Arrange
      const dto = {
        customerId: 'customer-123',
        businessId: 'business-456',
        context: 'Test context',
        channel: VoiceChannel.WHATSAPP,
        includeVideo: true,
        avatarImageUrl: 'https://example.com/avatar.jpg',
      };

      const mockVoiceMessage = VoiceMessage.create({
        script: 'Test script',
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: 'https://example.com/video.mp4',
        duration: 30,
        channel: VoiceChannel.WHATSAPP,
      }).value;

      jest.spyOn(service, 'generateVoiceMessage').mockResolvedValue(Result.ok(mockVoiceMessage));

      // Act
      const result = await controller.generateVoice(dto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.videoUrl).toBe(mockVoiceMessage.videoUrl);
    });
  });
});


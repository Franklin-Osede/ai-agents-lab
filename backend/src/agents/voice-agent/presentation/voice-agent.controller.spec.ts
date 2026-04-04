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

  const mockAiProvider = {
    transcribeAudio: jest.fn().mockResolvedValue('test transcript'),
    generateResponse: jest.fn().mockResolvedValue('test response'),
    generateAudio: jest.fn().mockResolvedValue(Buffer.from('audio')),
  };

  const mockPollyService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoiceAgentController],
      providers: [
        {
          provide: VoiceAgentService,
          useValue: mockService,
        },
        {
          provide: 'IAiProvider', // AI_PROVIDER_TOKEN
          useValue: mockAiProvider,
        },
        {
          provide: 'PollyService', // Adjust if real injection token is different
          useValue: mockPollyService,
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

  describe('interact', () => {
    it('should set English system prompt if language is en', async () => {
      const dto = { language: 'en', systemPrompt: 'Base prompt' };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.interact({ buffer: Buffer.from('') } as any, dto, res as any);

      expect(mockAiProvider.generateResponse).toHaveBeenCalledWith(
        'test transcript',
        expect.objectContaining({
          systemPrompt: expect.stringContaining('MUST respond ONLY in English'),
        }),
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Response-Language', 'en');
    });

    it('should set Spanish system prompt if language is es', async () => {
      const dto = { language: 'es', systemPrompt: 'Base prompt' };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.interact({ buffer: Buffer.from('') } as any, dto, res as any);

      expect(mockAiProvider.generateResponse).toHaveBeenCalledWith(
        'test transcript',
        expect.objectContaining({
          systemPrompt: expect.stringContaining('ÚNICAMENTE en Español'),
        }),
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Response-Language', 'es');
    });
  });
});

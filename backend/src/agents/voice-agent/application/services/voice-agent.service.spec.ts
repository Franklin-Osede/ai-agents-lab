import { Test, TestingModule } from '@nestjs/testing';
import { VoiceAgentService } from './voice-agent.service';
import { IVoiceProvider } from '../../domain/interfaces/voice-provider.interface';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import { VoiceChannel } from '../../domain/value-objects/voice-message';

describe('VoiceAgentService', () => {
  let service: VoiceAgentService;
  let voiceProvider: IVoiceProvider;
  let aiProvider: IAiProvider;

  const mockVoiceProvider: IVoiceProvider = {
    generateAudio: jest.fn(),
    generateVideo: jest.fn(),
  };

  const mockAiProvider: IAiProvider = {
    generateResponse: jest.fn(),
    classifyIntent: jest.fn(),
    transcribeAudio: jest.fn(),
    generateAudio: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceAgentService,
        {
          provide: 'IVoiceProvider',
          useValue: mockVoiceProvider,
        },
        {
          provide: AI_PROVIDER_TOKEN,
          useValue: mockAiProvider,
        },
      ],
    }).compile();

    service = module.get<VoiceAgentService>(VoiceAgentService);
    voiceProvider = module.get<IVoiceProvider>('IVoiceProvider');
    aiProvider = module.get<IAiProvider>(AI_PROVIDER_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateVoiceMessage', () => {
    it('should generate audio-only voice message', async () => {
      // Arrange
      const request = {
        customerId: 'customer-123',
        businessId: 'business-456',
        context: 'Cliente consultó sobre botox hace 3 días',
        channel: VoiceChannel.WHATSAPP,
        includeVideo: false,
      };

      const mockScript = 'Hola María, te escribo para seguir con tu consulta sobre botox.';
      const mockAudioUrl = 'https://example.com/audio.mp3';

      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue(mockScript);
      jest.spyOn(voiceProvider, 'generateAudio').mockResolvedValue(mockAudioUrl);

      // Act
      const result = await service.generateVoiceMessage(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.script).toBe(mockScript);
      expect(result.value.audioUrl).toBe(mockAudioUrl);
      expect(result.value.videoUrl).toBeUndefined();
      expect(voiceProvider.generateAudio).toHaveBeenCalledWith(mockScript, expect.any(Object));
    });

    it('should generate video voice message when requested', async () => {
      // Arrange
      const request = {
        customerId: 'customer-123',
        businessId: 'business-456',
        context: 'Cliente consultó sobre botox hace 3 días',
        channel: VoiceChannel.WHATSAPP,
        includeVideo: true,
        avatarImageUrl: 'https://example.com/avatar.jpg',
      };

      const mockScript = 'Hola María, te escribo para seguir con tu consulta sobre botox.';
      const mockAudioUrl = 'https://example.com/audio.mp3';
      const mockVideoUrl = 'https://example.com/video.mp4';

      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue(mockScript);
      jest.spyOn(voiceProvider, 'generateAudio').mockResolvedValue(mockAudioUrl);
      jest.spyOn(voiceProvider, 'generateVideo').mockResolvedValue(mockVideoUrl);

      // Act
      const result = await service.generateVoiceMessage(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.videoUrl).toBe(mockVideoUrl);
      expect(voiceProvider.generateVideo).toHaveBeenCalledWith(
        request.avatarImageUrl,
        mockAudioUrl,
        expect.any(Object),
      );
    });

    it('should generate personalized script based on context', async () => {
      // Arrange
      const request = {
        customerId: 'customer-123',
        businessId: 'business-456',
        context: 'Cliente consultó sobre botox hace 3 días',
        channel: VoiceChannel.WHATSAPP,
        includeVideo: false,
      };

      const mockScript = 'Hola María, te escribo para seguir con tu consulta sobre botox.';
      const mockAudioUrl = 'https://example.com/audio.mp3';

      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue(mockScript);
      jest.spyOn(voiceProvider, 'generateAudio').mockResolvedValue(mockAudioUrl);

      // Act
      await service.generateVoiceMessage(request);

      // Assert
      expect(aiProvider.generateResponse).toHaveBeenCalledWith(
        expect.stringContaining(request.context),
        expect.objectContaining({
          systemPrompt: expect.stringContaining('voice message'),
        }),
      );
    });

    it('should handle AI provider errors gracefully', async () => {
      // Arrange
      const request = {
        customerId: 'customer-123',
        businessId: 'business-456',
        context: 'Test context',
        channel: VoiceChannel.WHATSAPP,
        includeVideo: false,
      };

      jest.spyOn(aiProvider, 'generateResponse').mockRejectedValue(new Error('AI Error'));

      // Act
      const result = await service.generateVoiceMessage(request);

      // Assert
      expect(result.isFailure).toBe(true);
    });

    it('should handle voice provider errors gracefully', async () => {
      // Arrange
      const request = {
        customerId: 'customer-123',
        businessId: 'business-456',
        context: 'Test context',
        channel: VoiceChannel.WHATSAPP,
        includeVideo: false,
      };

      const mockScript = 'Test script';
      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue(mockScript);
      jest.spyOn(voiceProvider, 'generateAudio').mockRejectedValue(new Error('Voice Error'));

      // Act
      const result = await service.generateVoiceMessage(request);

      // Assert
      expect(result.isFailure).toBe(true);
    });

    it('should estimate duration based on script length', async () => {
      // Arrange
      const request = {
        customerId: 'customer-123',
        businessId: 'business-456',
        context: 'Test context',
        channel: VoiceChannel.WHATSAPP,
        includeVideo: false,
      };

      const mockScript = 'Este es un script de prueba que tiene aproximadamente veinte palabras.';
      const mockAudioUrl = 'https://example.com/audio.mp3';

      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue(mockScript);
      jest.spyOn(voiceProvider, 'generateAudio').mockResolvedValue(mockAudioUrl);

      // Act
      const result = await service.generateVoiceMessage(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.duration).toBeGreaterThan(0);
    });
  });
});

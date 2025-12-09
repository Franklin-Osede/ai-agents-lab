import { VoiceMessage, VoiceChannel } from './voice-message';
import { Result } from '../../../../core/domain/shared/value-objects/result';

describe('VoiceMessage Value Object', () => {
  describe('create', () => {
    it('should create valid voice message with all fields', () => {
      // Arrange & Act
      const voiceMessage = VoiceMessage.create({
        script: 'Hola María, te escribo para seguir con tu consulta sobre botox.',
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: 'https://example.com/video.mp4',
        duration: 30,
        channel: VoiceChannel.WHATSAPP,
      });

      // Assert
      expect(voiceMessage.isSuccess).toBe(true);
      expect(voiceMessage.value.script).toBe(
        'Hola María, te escribo para seguir con tu consulta sobre botox.',
      );
      expect(voiceMessage.value.audioUrl).toBe('https://example.com/audio.mp3');
      expect(voiceMessage.value.videoUrl).toBe('https://example.com/video.mp4');
      expect(voiceMessage.value.duration).toBe(30);
      expect(voiceMessage.value.channel).toBe('WHATSAPP');
    });

    it('should create voice message with only audio', () => {
      // Arrange & Act
      const voiceMessage = VoiceMessage.create({
        script: 'Test script',
        audioUrl: 'https://example.com/audio.mp3',
      });

      // Assert
      expect(voiceMessage.isSuccess).toBe(true);
      expect(voiceMessage.value.audioUrl).toBeDefined();
      expect(voiceMessage.value.videoUrl).toBeUndefined();
    });

    it('should validate script is not empty', () => {
      // Arrange & Act
      const voiceMessage = VoiceMessage.create({
        script: '',
        audioUrl: 'https://example.com/audio.mp3',
      });

      // Assert
      expect(voiceMessage.isFailure).toBe(true);
    });

    it('should validate script max length', () => {
      // Arrange
      const longScript = 'a'.repeat(5001);

      // Act
      const voiceMessage = VoiceMessage.create({
        script: longScript,
        audioUrl: 'https://example.com/audio.mp3',
      });

      // Assert
      expect(voiceMessage.isFailure).toBe(true);
    });

    it('should validate URL format', () => {
      // Arrange & Act
      const voiceMessage = VoiceMessage.create({
        script: 'Test script',
        audioUrl: 'invalid-url',
      });

      // Assert
      expect(voiceMessage.isFailure).toBe(true);
    });
  });

  describe('hasVideo', () => {
    it('should return true when video URL exists', () => {
      // Arrange
      const voiceMessage = VoiceMessage.create({
        script: 'Test',
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: 'https://example.com/video.mp4',
      }).value;

      // Act & Assert
      expect(voiceMessage.hasVideo()).toBe(true);
    });

    it('should return false when no video URL', () => {
      // Arrange
      const voiceMessage = VoiceMessage.create({
        script: 'Test',
        audioUrl: 'https://example.com/audio.mp3',
      }).value;

      // Act & Assert
      expect(voiceMessage.hasVideo()).toBe(false);
    });
  });

  describe('getEstimatedCost', () => {
    it('should calculate cost for audio only', () => {
      // Arrange
      const voiceMessage = VoiceMessage.create({
        script: 'Test script',
        audioUrl: 'https://example.com/audio.mp3',
        duration: 30, // 30 seconds
      }).value;

      // Act
      const cost = voiceMessage.getEstimatedCost();

      // Assert - D-ID audio: ~$0.01 per second
      expect(cost).toBeCloseTo(0.3, 2);
    });

    it('should calculate cost for video', () => {
      // Arrange
      const voiceMessage = VoiceMessage.create({
        script: 'Test script',
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: 'https://example.com/video.mp4',
        duration: 30,
      }).value;

      // Act
      const cost = voiceMessage.getEstimatedCost();

      // Assert - D-ID video: ~$0.06 per second
      expect(cost).toBeCloseTo(1.8, 2);
    });
  });
});

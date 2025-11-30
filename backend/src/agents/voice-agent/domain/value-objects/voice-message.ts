import { Result } from '../../../../core/domain/shared/value-objects/result';

export enum VoiceChannel {
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  TELEGRAM = 'TELEGRAM',
  EMAIL = 'EMAIL',
}

/**
 * VoiceMessage Value Object
 * 
 * Represents a generated voice/video message for customer outreach.
 * Follows DDD principles: immutable, validated, business logic encapsulation.
 */
export class VoiceMessage {
  private constructor(
    public readonly script: string,
    public readonly audioUrl: string,
    public readonly videoUrl?: string,
    public readonly duration?: number,
    public readonly channel?: VoiceChannel,
  ) {}

  /**
   * Factory method to create VoiceMessage
   */
  static create(data: {
    script: string;
    audioUrl: string;
    videoUrl?: string;
    duration?: number;
    channel?: VoiceChannel;
  }): Result<VoiceMessage> {
    // Validate script
    if (!data.script || data.script.trim().length === 0) {
      return Result.fail(new Error('Script cannot be empty'));
    }

    if (data.script.length > 5000) {
      return Result.fail(new Error('Script cannot exceed 5000 characters'));
    }

    // Validate audio URL
    if (!this.isValidUrl(data.audioUrl)) {
      return Result.fail(new Error('Invalid audio URL format'));
    }

    // Validate video URL if provided
    if (data.videoUrl && !this.isValidUrl(data.videoUrl)) {
      return Result.fail(new Error('Invalid video URL format'));
    }

    const voiceMessage = new VoiceMessage(
      data.script.trim(),
      data.audioUrl,
      data.videoUrl,
      data.duration,
      data.channel,
    );

    return Result.ok(voiceMessage);
  }

  /**
   * Check if message has video
   */
  hasVideo(): boolean {
    return !!this.videoUrl;
  }

  /**
   * Get estimated cost in USD
   * D-ID pricing: Audio ~$0.01/sec, Video ~$0.06/sec (includes audio)
   */
  getEstimatedCost(): number {
    if (!this.duration) {
      return 0;
    }

    const seconds = this.duration;
    // If video exists, use video pricing (which includes audio)
    // Otherwise, use audio-only pricing
    const costPerSecond = this.hasVideo() ? 0.06 : 0.01;

    return seconds * costPerSecond;
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject(): {
    script: string;
    audioUrl: string;
    videoUrl?: string;
    duration?: number;
    channel?: string;
    estimatedCost: number;
  } {
    return {
      script: this.script,
      audioUrl: this.audioUrl,
      videoUrl: this.videoUrl,
      duration: this.duration,
      channel: this.channel,
      estimatedCost: this.getEstimatedCost(),
    };
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}


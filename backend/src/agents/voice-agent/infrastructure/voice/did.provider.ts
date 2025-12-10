import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IVoiceProvider } from '../../domain/interfaces/voice-provider.interface';

/**
 * D-ID Provider
 *
 * Implementation of IVoiceProvider using D-ID API.
 * D-ID is the cheapest option: $5.99/month with good quality.
 *
 * Documentation: https://docs.d-id.com/
 */
@Injectable()
export class DidProvider implements IVoiceProvider {
  private readonly logger = new Logger(DidProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.d-id.com';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DID_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('DID_API_KEY not configured. Voice generation will be mocked.');
    }
  }

  async generateAudio(
    text: string,
    options?: {
      voiceId?: string;
      language?: string;
      speed?: number;
    },
  ): Promise<string> {
    try {
      // If API key not configured, return mock URL for development
      if (!this.apiKey) {
        this.logger.log('Using mock audio generation (DID_API_KEY not set)');
        return this.getMockAudioUrl();
      }

      // D-ID uses text-to-speech through their API
      // For now, we'll use a simple implementation
      // In production, you'd call D-ID's API here

      const response = await fetch(`${this.baseUrl}/talks`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: text,
            provider: {
              type: 'amazon',
              voice_id: options?.voiceId || 'es-ES-EnriqueNeural', // Spanish voice
            },
            ssml: false,
          },
          config: {
            result_format: 'mp3',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result_url || this.getMockAudioUrl();
    } catch (error) {
      this.logger.error(`Failed to generate audio: ${error.message}`);
      // Fallback to mock for development
      return this.getMockAudioUrl();
    }
  }

  async generateVideo(
    imageUrl: string,
    audioUrl: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: {
      style?: string;
      quality?: 'low' | 'medium' | 'high';
    },
  ): Promise<string> {
    try {
      // If API key not configured, return mock URL for development
      if (!this.apiKey) {
        this.logger.log('Using mock video generation (DID_API_KEY not set)');
        return this.getMockVideoUrl();
      }

      // D-ID creates talking head videos
      const response = await fetch(`${this.baseUrl}/talks`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: imageUrl,
          script: {
            type: 'audio',
            audio_url: audioUrl,
          },
          config: {
            result_format: 'mp4',
            fluent: true,
            pad_audio: 0.0,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.statusText}`);
      }

      const data = await response.json();

      // D-ID returns a job ID, we need to poll for result
      const videoUrl = await this.pollForVideoResult(data.id);
      return videoUrl || this.getMockVideoUrl();
    } catch (error) {
      this.logger.error(`Failed to generate video: ${error.message}`);
      // Fallback to mock for development
      return this.getMockVideoUrl();
    }
  }

  /**
   * Poll D-ID API for video generation result
   */
  private async pollForVideoResult(jobId: string, maxAttempts = 30): Promise<string | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      try {
        const response = await fetch(`${this.baseUrl}/talks/${jobId}`, {
          headers: {
            Authorization: `Basic ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        if (data.status === 'done' && data.result_url) {
          return data.result_url;
        }

        if (data.status === 'error') {
          throw new Error(data.error || 'Video generation failed');
        }
      } catch (error) {
        this.logger.warn(`Polling attempt ${attempt + 1} failed: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Get mock audio URL for development
   */
  private getMockAudioUrl(): string {
    return 'https://example.com/mock-audio.mp3';
  }

  /**
   * Get mock video URL for development
   */
  private getMockVideoUrl(): string {
    return 'https://example.com/mock-video.mp4';
  }
}

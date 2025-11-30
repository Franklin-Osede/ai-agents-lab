/**
 * Voice Provider Interface
 * 
 * Abstraction for voice/video generation services.
 * Follows Dependency Inversion Principle - depends on abstraction, not concrete implementation.
 */
export interface IVoiceProvider {
  /**
   * Generate audio from text
   * @param text - Text to convert to speech
   * @param options - Voice options (voice ID, language, etc.)
   * @returns URL of generated audio file
   */
  generateAudio(
    text: string,
    options?: {
      voiceId?: string;
      language?: string;
      speed?: number;
    },
  ): Promise<string>;

  /**
   * Generate video with talking avatar
   * @param imageUrl - URL of image to animate
   * @param audioUrl - URL of audio file
   * @param options - Video options
   * @returns URL of generated video file
   */
  generateVideo(
    imageUrl: string,
    audioUrl: string,
    options?: {
      style?: string;
      quality?: 'low' | 'medium' | 'high';
    },
  ): Promise<string>;
}


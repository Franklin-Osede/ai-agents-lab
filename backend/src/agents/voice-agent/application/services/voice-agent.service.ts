import { Injectable, Inject, Logger } from '@nestjs/common';
import { IVoiceProvider } from '../../domain/interfaces/voice-provider.interface';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import { VoiceMessage, VoiceChannel } from '../../domain/value-objects/voice-message';
import { Result } from '../../../../core/domain/shared/value-objects/result';

export interface GenerateVoiceRequest {
  customerId: string;
  businessId: string;
  context: string;
  channel: VoiceChannel;
  includeVideo?: boolean;
  avatarImageUrl?: string;
  customerName?: string;
  language?: string;
}

/**
 * VoiceAgentService
 *
 * Application Service responsible for generating personalized voice/video messages.
 * Follows Single Responsibility Principle - only handles voice message generation.
 * Uses AI Provider and Voice Provider abstractions (Dependency Inversion).
 */
@Injectable()
export class VoiceAgentService {
  private readonly logger = new Logger(VoiceAgentService.name);

  constructor(
    @Inject('IVoiceProvider') private readonly voiceProvider: IVoiceProvider,
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: IAiProvider,
  ) {}

  /**
   * Generate personalized voice message
   *
   * @param request - Request with customer context and preferences
   * @returns Result containing VoiceMessage or error
   */
  async generateVoiceMessage(request: GenerateVoiceRequest): Promise<Result<VoiceMessage>> {
    try {
      this.logger.log(
        `Generating voice message for customer: ${request.customerId}, channel: ${request.channel}`,
      );

      // Step 1: Generate personalized script using AI
      const script = await this.generatePersonalizedScript(request);

      // Step 2: Generate audio from script
      const audioUrl = await this.voiceProvider.generateAudio(script, {
        language: request.language || 'es',
        voiceId: 'es-ES-EnriqueNeural', // Spanish voice
      });

      // Step 3: Generate video if requested
      let videoUrl: string | undefined;
      if (request.includeVideo && request.avatarImageUrl) {
        videoUrl = await this.voiceProvider.generateVideo(request.avatarImageUrl, audioUrl, {
          quality: 'high',
        });
      }

      // Step 4: Estimate duration (average: 150 words per minute = 2.5 words per second)
      const wordCount = script.split(/\s+/).length;
      const estimatedDuration = Math.ceil(wordCount / 2.5);

      // Step 5: Create VoiceMessage value object
      const voiceMessageResult = VoiceMessage.create({
        script,
        audioUrl,
        videoUrl,
        duration: estimatedDuration,
        channel: request.channel,
      });

      if (voiceMessageResult.isFailure) {
        return Result.fail(voiceMessageResult.error);
      }

      this.logger.log(
        `Voice message generated successfully. Duration: ${estimatedDuration}s, Cost: $${voiceMessageResult.value.getEstimatedCost().toFixed(2)}`,
      );

      return Result.ok(voiceMessageResult.value);
    } catch (error) {
      this.logger.error(`Failed to generate voice message: ${error.message}`, error.stack);
      return Result.fail(error as Error);
    }
  }

  /**
   * Generate personalized script using AI
   * Private method following Single Responsibility
   */
  private async generatePersonalizedScript(request: GenerateVoiceRequest): Promise<string> {
    const systemPrompt = `You are a professional customer outreach assistant.
Your role is to generate short, friendly, and personalized voice messages for customer follow-up.
Keep messages concise (30-60 seconds when spoken), natural, and conversational.
Use the customer's name if provided, and reference the context naturally.`;

    const userPrompt = `Generate a personalized voice message script for:
- Customer: ${request.customerName || 'the customer'}
- Context: ${request.context}
- Channel: ${request.channel}
- Tone: Friendly, professional, and conversational
- Length: 30-60 seconds when spoken

Generate ONLY the script text, no additional formatting or explanations.`;

    try {
      const script = await this.aiProvider.generateResponse(userPrompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 200,
      });

      return script.trim();
    } catch (error) {
      this.logger.error(`Failed to generate script: ${error.message}`);
      throw error; // Re-throw to be handled by caller
    }
  }
}

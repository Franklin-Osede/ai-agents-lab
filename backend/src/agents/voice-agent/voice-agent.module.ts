import { Module } from '@nestjs/common';
import { VoiceAgentController } from './presentation/voice-agent.controller';
import { VoiceAgentService } from './application/services/voice-agent.service';
import { CoreModule } from '../../core/core.module';
import { DidProvider } from './infrastructure/voice/did.provider';

/**
 * Voice Agent Module
 * 
 * Independent module for generating personalized voice/video messages.
 * Uses D-ID as the voice/video provider (cheapest option: $5.99/month).
 * 
 * Structure follows Clean Architecture:
 * - domain/: Entities and Value Objects
 * - application/: Use Cases and Services
 * - infrastructure/: D-ID Provider implementation
 * - presentation/: Controllers and DTOs
 */
@Module({
  imports: [CoreModule],
  controllers: [VoiceAgentController],
  providers: [
    VoiceAgentService,
    {
      provide: 'IVoiceProvider',
      useClass: DidProvider,
    },
  ],
  exports: [VoiceAgentService],
})
export class VoiceAgentModule {}


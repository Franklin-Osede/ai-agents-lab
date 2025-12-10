import { Module } from '@nestjs/common';
import { WebinarRecoveryController } from './presentation/webinar-recovery.controller';
import { WebinarRecoveryService } from './application/services/webinar-recovery.service';
import { InMemoryWebinarRepository } from './infrastructure/repositories/in-memory-webinar.repository';
import { VoiceAgentModule } from '../voice-agent/voice-agent.module';

@Module({
  imports: [VoiceAgentModule],
  controllers: [WebinarRecoveryController],
  providers: [
    WebinarRecoveryService,
    {
      provide: 'IWebinarRepository',
      useClass: InMemoryWebinarRepository,
    },
  ],
  exports: [WebinarRecoveryService],
})
export class WebinarRecoveryModule {}

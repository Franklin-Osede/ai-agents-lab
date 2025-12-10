import { Module } from '@nestjs/common';
import { AbandonedCartController } from './presentation/abandoned-cart.controller';
import { RecoverCartService } from './application/services/recover-cart.service';
import { InMemoryCartRepository } from './infrastructure/repositories/in-memory-cart.repository';
import { VoiceAgentModule } from '../voice-agent/voice-agent.module';

@Module({
  imports: [VoiceAgentModule],
  controllers: [AbandonedCartController],
  providers: [
    RecoverCartService,
    {
      provide: 'ICartRepository',
      useClass: InMemoryCartRepository,
    },
  ],
  exports: [RecoverCartService],
})
export class AbandonedCartModule {}

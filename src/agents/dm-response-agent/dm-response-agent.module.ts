import { Module } from '@nestjs/common';
import { DmResponseAgentController } from './presentation/dm-response-agent.controller';
import { DmResponseAgentService } from './application/services/dm-response-agent.service';
import { IntentClassifierService } from '../../../shared/services/intent-classifier.service';
import { CoreModule } from '../../core/core.module';

/**
 * DM Response Agent Module
 *
 * Independent module for handling direct messages from various channels
 * (Instagram, WhatsApp, Telegram, etc.)
 */
@Module({
  imports: [CoreModule],
  controllers: [DmResponseAgentController],
  providers: [
    DmResponseAgentService,
    IntentClassifierService,
    {
      provide: 'IMessageRepository',
      useValue: null, // Placeholder - implement repository in infrastructure layer
    },
  ],
  exports: [DmResponseAgentService],
})
export class DmResponseAgentModule {}

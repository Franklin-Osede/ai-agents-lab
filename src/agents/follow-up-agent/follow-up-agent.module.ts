import { Module } from '@nestjs/common';
import { FollowUpAgentController } from './presentation/follow-up-agent.controller';
import { FollowUpAgentService } from './application/services/follow-up-agent.service';
import { CoreModule } from '../../core/core.module';

/**
 * Follow-up Agent Module
 *
 * Independent module for generating automated follow-up messages
 * to re-engage customers who haven't responded
 */
@Module({
  imports: [CoreModule],
  controllers: [FollowUpAgentController],
  providers: [
    FollowUpAgentService,
    {
      provide: 'IFollowUpRepository',
      useValue: null, // Placeholder - implement repository in infrastructure layer
    },
  ],
  exports: [FollowUpAgentService],
})
export class FollowUpAgentModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { BookingAgentModule } from './agents/booking-agent/booking-agent.module';
import { DmResponseAgentModule } from './agents/dm-response-agent/dm-response-agent.module';
import { FollowUpAgentModule } from './agents/follow-up-agent/follow-up-agent.module';

/**
 * Main Application Module
 *
 * This is a monorepo structure where:
 * - CoreModule: Provides shared infrastructure (AI, DB, etc.)
 * - Each Agent Module: Independent but uses CoreModule
 *
 * To add a new agent:
 * 1. Create folder in src/agents/new-agent/
 * 2. Implement domain, application, presentation layers
 * 3. Import module here
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CoreModule, // Shared infrastructure
    BookingAgentModule,
    DmResponseAgentModule,
    FollowUpAgentModule,
  ],
})
export class AppModule {}

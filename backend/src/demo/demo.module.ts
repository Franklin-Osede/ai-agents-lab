import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { BookingAgentModule } from '../agents/booking-agent/booking-agent.module';

/**
 * Demo Module
 *
 * Provides public demo endpoints for trying agents without registration
 */
@Module({
  imports: [BookingAgentModule],
  controllers: [DemoController],
})
export class DemoModule {}

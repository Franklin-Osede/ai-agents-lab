import { Module } from '@nestjs/common';
import { BookingAgentController } from './presentation/booking-agent.controller';
import { BookingAgentService } from './application/services/booking-agent.service';
import { IntentClassifierService } from '@shared/services/intent-classifier.service';
import { CoreModule } from '../../core/core.module';
import { ConfigModule } from '@nestjs/config';
import { InMemoryBookingRepository } from './infrastructure/repositories/in-memory-booking.repository';

/**
 * Booking Agent Module
 *
 * Independent module for handling booking requests.
 * Each agent module follows the same structure:
 * - domain/: Entities and business logic
 * - application/: Use cases and services
 * - presentation/: Controllers and DTOs
 */
@Module({
  imports: [CoreModule, ConfigModule],
  controllers: [BookingAgentController],
  providers: [
    BookingAgentService,
    IntentClassifierService,
    // Repository - Use InMemoryBookingRepository for demos
    // In production, replace with real database repository
    InMemoryBookingRepository,
    {
      provide: 'IBookingRepository',
      useClass: InMemoryBookingRepository,
    },
  ],
  exports: [BookingAgentService],
})
export class BookingAgentModule {}

import { Module } from '@nestjs/common';
import { BookingAgentController } from './presentation/booking-agent.controller';
import { BookingAgentService } from './application/services/booking-agent.service';
import { IntentClassifierService } from '@shared/services/intent-classifier.service';
import { CoreModule } from '../../core/core.module';

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
  imports: [CoreModule],
  controllers: [BookingAgentController],
  providers: [
    BookingAgentService,
    IntentClassifierService,
    // In real implementation, you'd inject the repository here
    {
      provide: 'IBookingRepository',
      useValue: null, // Placeholder - implement repository in infrastructure layer
    },
  ],
  exports: [BookingAgentService],
})
export class BookingAgentModule {}

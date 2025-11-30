import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IBookingRepository } from '../../domain/interfaces/booking-repository.interface';

const schema = z.object({
  businessId: z.string().describe('Business ID to check availability for'),
  date: z.string().describe('Date in YYYY-MM-DD format to check availability'),
  duration: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Duration in minutes (optional, defaults to 60)'),
});

/**
 * Helper function to create DynamicStructuredTool without TypeScript deep instantiation errors
 * This is a workaround for LangChain v1.x TypeScript limitations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTool(config: any): any {
  return new DynamicStructuredTool(config);
}

/**
 * CheckAvailabilityTool
 *
 * LangChain tool for checking available time slots for a specific date.
 * Used by the booking agent to query availability from the repository.
 */
@Injectable()
export class CheckAvailabilityTool {
  private readonly logger = new Logger(CheckAvailabilityTool.name);
  // NOTE: Using 'any' here due to known TypeScript deep instantiation issue with LangChain v1.x
  // The tool works correctly at runtime, this is only a TypeScript compiler limitation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toolInstance: any = null;

  constructor(
    @Inject('IBookingRepository') private readonly bookingRepository: IBookingRepository | null,
  ) {}

  /**
   * Get the LangChain tool instance (lazy initialization)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTool(): any {
    if (!this.toolInstance) {
      this.toolInstance = createTool({
        name: 'check_availability',
        description:
          'Check available time slots for a specific date. Use this when customer asks about availability or wants to book an appointment.',
        schema,
        func: async ({
          businessId,
          date,
          duration = 60,
        }: {
          businessId: string;
          date: string;
          duration?: number;
        }) => {
          try {
            this.logger.log(`Checking availability for business ${businessId} on ${date}`);

            if (!this.bookingRepository) {
              this.logger.warn('Booking repository not available, returning default slots');
              return JSON.stringify({
                date,
                availableSlots: ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
                duration,
              });
            }

            const dateObj = new Date(date);
            const slots = await this.bookingRepository.findAvailableSlots(businessId, dateObj);

            this.logger.log(`Found ${slots.length} available slots for ${date}`);

            return JSON.stringify({
              date,
              availableSlots: slots,
              duration,
              count: slots.length,
            });
          } catch (error) {
            this.logger.error(`Error checking availability: ${(error as Error).message}`);
            return JSON.stringify({
              date,
              availableSlots: [],
              duration,
              error: 'Unable to check availability at this time',
            });
          }
        },
      });
    }
    return this.toolInstance;
  }
}

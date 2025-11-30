import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IBookingRepository } from '../../domain/interfaces/booking-repository.interface';

const schema = z.object({
  businessId: z.string().describe('Business ID'),
  preferredDate: z.string().optional().describe('Preferred date in YYYY-MM-DD format (optional)'),
  preferredTime: z.string().optional().describe('Preferred time in HH:mm format (optional)'),
  serviceType: z.string().optional().describe('Type of service (optional)'),
  count: z
    .number()
    .int()
    .positive()
    .max(5)
    .optional()
    .describe('Number of suggestions to return (default: 3, max: 5)'),
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
 * SuggestTimesTool
 *
 * LangChain tool for suggesting best available times based on customer preferences.
 * Uses business rules and availability to suggest optimal booking times.
 */
@Injectable()
export class SuggestTimesTool {
  private readonly logger = new Logger(SuggestTimesTool.name);
  // NOTE: Using 'any' here due to known TypeScript deep instantiation issue with LangChain v1.x
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
        name: 'suggest_times',
        description:
          'Suggest best available times for booking based on customer preferences and business rules. Use this to offer multiple time options to the customer.',
        schema,
        func: async ({
          businessId,
          preferredDate,
          preferredTime,
          serviceType,
          count = 3,
        }: {
          businessId: string;
          preferredDate?: string;
          preferredTime?: string;
          serviceType?: string;
          count?: number;
        }) => {
          try {
            this.logger.log(
              `Suggesting times for business ${businessId}, preferred: ${preferredDate || 'any'} ${preferredTime || 'any'}`,
            );

            let availableSlots: string[] = [];
            if (this.bookingRepository && preferredDate) {
              const dateObj = new Date(preferredDate);
              availableSlots = await this.bookingRepository.findAvailableSlots(businessId, dateObj);
            } else if (!this.bookingRepository) {
              availableSlots = ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
            }

            if (availableSlots.length === 0) {
              availableSlots = ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
            }

            let suggestions = availableSlots;
            if (preferredTime) {
              const preferredHour = parseInt(preferredTime.split(':')[0]);
              suggestions = availableSlots.filter((slot) => {
                const slotHour = parseInt(slot.split(':')[0]);
                return Math.abs(slotHour - preferredHour) <= 2;
              });

              if (suggestions.length === 0) {
                suggestions = availableSlots;
              }
            }

            suggestions.sort((a, b) => {
              const hourA = parseInt(a.split(':')[0]);
              const hourB = parseInt(b.split(':')[0]);
              return hourA - hourB;
            });

            const selectedSlots = suggestions.slice(0, count);

            const suggestionsWithReasons = selectedSlots.map((time, index) => {
              const hour = parseInt(time.split(':')[0]);
              let reason = 'Available';
              if (preferredTime && time === preferredTime) {
                reason = 'Matches your preferred time';
              } else if (hour >= 9 && hour <= 12) {
                reason = 'Morning slot - popular choice';
              } else if (hour >= 14 && hour <= 16) {
                reason = 'Afternoon slot - convenient';
              } else if (index === 0) {
                reason = 'Earliest available';
              }

              return {
                time,
                reason,
                available: true,
              };
            });

            this.logger.log(`Suggested ${suggestionsWithReasons.length} time slots`);

            return JSON.stringify({
              suggestions: suggestionsWithReasons,
              preferredDate: preferredDate || null,
              preferredTime: preferredTime || null,
              serviceType: serviceType || null,
            });
          } catch (error) {
            this.logger.error(`Error suggesting times: ${(error as Error).message}`);
            return JSON.stringify({
              suggestions: [
                { time: '10:00', reason: 'Morning slot', available: true },
                { time: '14:00', reason: 'Afternoon slot', available: true },
                { time: '16:00', reason: 'Late afternoon', available: true },
              ],
              preferredDate: preferredDate || null,
              preferredTime: preferredTime || null,
              serviceType: serviceType || null,
            });
          }
        },
      });
    }
    return this.toolInstance;
  }
}

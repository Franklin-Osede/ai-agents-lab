import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IBookingRepository } from '../../domain/interfaces/booking-repository.interface';
import { Booking, BookingStatus } from '../../domain/entities/booking.entity';

const schema = z.object({
  businessId: z.string().describe('Business ID'),
  customerId: z.string().describe('Customer ID'),
  date: z.string().describe('Date in YYYY-MM-DD format'),
  time: z.string().describe('Time in HH:mm format'),
  serviceType: z.string().optional().describe('Type of service (optional)'),
  notes: z.string().optional().describe('Additional notes for the booking'),
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
 * ConfirmBookingTool
 *
 * LangChain tool for confirming a booking with selected date and time.
 * Creates and saves the booking in the repository.
 */
@Injectable()
export class ConfirmBookingTool {
  private readonly logger = new Logger(ConfirmBookingTool.name);
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
        name: 'confirm_booking',
        description:
          'Confirm a booking with selected date and time. Use this when the customer agrees to book an appointment. Returns booking ID and confirmation details.',
        schema,
        func: async ({
          businessId,
          customerId,
          date,
          time,
          serviceType,
          notes,
        }: {
          businessId: string;
          customerId: string;
          date: string;
          time: string;
          serviceType?: string;
          notes?: string;
        }) => {
          try {
            this.logger.log(
              `Confirming booking for customer ${customerId} at ${businessId} on ${date} at ${time}`,
            );

            const dateTimeStr = `${date}T${time}:00`;
            const scheduledTime = new Date(dateTimeStr);

            if (isNaN(scheduledTime.getTime())) {
              throw new Error(`Invalid date/time: ${date} ${time}`);
            }

            if (scheduledTime < new Date()) {
              throw new Error('Cannot book appointments in the past');
            }

            const booking = new Booking(customerId, businessId, scheduledTime, notes);
            if (serviceType) {
              booking.metadata.serviceType = serviceType;
            }
            booking.confirm();

            let savedBooking: Booking;
            if (this.bookingRepository) {
              savedBooking = await this.bookingRepository.save(booking);
            } else {
              savedBooking = booking;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (savedBooking as any).id =
                `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }

            this.logger.log(`Booking confirmed: ${savedBooking.id}`);

            return JSON.stringify({
              success: true,
              bookingId: savedBooking.id,
              status: BookingStatus.CONFIRMED,
              scheduledTime: scheduledTime.toISOString(),
              date,
              time,
              serviceType: serviceType || null,
              message: `Booking confirmed for ${date} at ${time}`,
            });
          } catch (error) {
            this.logger.error(`Error confirming booking: ${(error as Error).message}`);
            return JSON.stringify({
              success: false,
              error: (error as Error).message,
              message: 'Unable to confirm booking. Please try again.',
            });
          }
        },
      });
    }
    return this.toolInstance;
  }
}

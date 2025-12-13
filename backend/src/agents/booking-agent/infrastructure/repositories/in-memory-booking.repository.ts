import { Injectable, Logger } from '@nestjs/common';
import { IBookingRepository } from '../../domain/interfaces/booking-repository.interface';
import { Booking, BookingStatus } from '../../domain/entities/booking.entity';

/**
 * InMemoryBookingRepository
 *
 * Mock implementation of IBookingRepository for demos and testing.
 * Provides realistic availability with preseeded slots and conflict detection.
 */
@Injectable()
export class InMemoryBookingRepository implements IBookingRepository {
  private readonly logger = new Logger(InMemoryBookingRepository.name);
  private readonly bookings: Map<string, Booking> = new Map();

  // Business hours configuration (9 AM - 6 PM)
  private readonly BUSINESS_HOURS = {
    start: 9,
    end: 18,
  };

  // Slot duration in minutes
  private readonly SLOT_DURATION = 60;

  // Preseeded bookings for realistic demos
  private readonly PRESEEDED_BOOKINGS: Array<{
    businessId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
  }> = [
    // Today - some slots taken
    { businessId: 'demo-business-1', date: this.getTodayString(), time: '10:00' },
    { businessId: 'demo-business-1', date: this.getTodayString(), time: '14:00' },
    // Tomorrow - more availability
    { businessId: 'demo-business-1', date: this.getTomorrowString(), time: '11:00' },
    // Next week - mostly available
  ];

  constructor() {
    this.initializePreseededBookings();
    this.logger.log('InMemoryBookingRepository initialized with preseeded bookings');
  }

  /**
   * Initialize preseeded bookings
   */
  private initializePreseededBookings(): void {
    this.PRESEEDED_BOOKINGS.forEach((preseed) => {
      const dateTime = new Date(`${preseed.date}T${preseed.time}:00`);
      const bookingId = `PRESEED-${preseed.businessId}-${preseed.date}-${preseed.time}`;
      // Create booking with explicit ID
      const booking = Object.create(Booking.prototype);
      booking.id = bookingId;
      booking.customerId = 'preseeded-customer';
      booking.businessId = preseed.businessId;
      booking.scheduledTime = dateTime;
      booking.status = BookingStatus.CONFIRMED;
      booking.notes = undefined;
      booking.metadata = {};
      booking.createdAt = new Date();
      booking.updatedAt = new Date();
      this.bookings.set(booking.id, booking as Booking);
    });
  }

  /**
   * Generate all possible time slots for a day
   */
  private generateAllSlots(): string[] {
    const slots: string[] = [];
    for (let hour = this.BUSINESS_HOURS.start; hour < this.BUSINESS_HOURS.end; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }

  /**
   * Get bookings for a specific business and date
   */
  private getBookingsForDate(businessId: string, date: Date): Booking[] {
    const dateStr = this.formatDate(date);
    return Array.from(this.bookings.values()).filter((booking) => {
      const bookingDateStr = this.formatDate(booking.scheduledTime);
      return (
        booking.businessId === businessId &&
        bookingDateStr === dateStr &&
        booking.status !== BookingStatus.CANCELLED
      );
    });
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get today's date as string
   */
  private getTodayString(): string {
    return this.formatDate(new Date());
  }

  /**
   * Get tomorrow's date as string
   */
  private getTomorrowString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatDate(tomorrow);
  }

  /**
   * Check if a slot conflicts with existing bookings
   */
  private hasConflict(businessId: string, date: Date, time: string): boolean {
    const bookings = this.getBookingsForDate(businessId, date);
    return bookings.some((booking) => {
      const bookingTime = booking.scheduledTime.toTimeString().substring(0, 5);
      return bookingTime === time;
    });
  }

  async save(booking: Booking): Promise<Booking> {
    try {
      // Ensure ID is set (BaseEntity should handle this, but double-check)
      if (!booking.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (booking as any).id = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Update timestamp
      booking.updateTimestamp();

      // Check for conflicts
      const time = booking.scheduledTime.toTimeString().substring(0, 5);
      const date = new Date(booking.scheduledTime);
      if (this.hasConflict(booking.businessId, date, time)) {
        throw new Error(`Slot ${time} on ${this.formatDate(date)} is already booked`);
      }

      this.bookings.set(booking.id, booking);
      this.logger.log(`Booking saved: ${booking.id} for ${this.formatDate(date)} at ${time}`);

      return booking;
    } catch (error) {
      this.logger.error(`Error saving booking: ${(error as Error).message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.get(id) || null;
  }

  async findByCustomerId(customerId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.customerId === customerId,
    );
  }

  async findByBusinessId(businessId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.businessId === businessId,
    );
  }

  async findAvailableSlots(businessId: string, date: Date): Promise<string[]> {
    try {
      // Get all possible slots
      const allSlots = this.generateAllSlots();

      // Get existing bookings for this date
      const existingBookings = this.getBookingsForDate(businessId, date);

      // Create a set of booked times
      const bookedTimes = new Set(
        existingBookings.map((booking) => booking.scheduledTime.toTimeString().substring(0, 5)),
      );

      // Filter out booked slots
      const availableSlots = allSlots.filter((slot) => !bookedTimes.has(slot));

      // Add some randomness for realism (sometimes slots are "unavailable" even if not booked)
      // This simulates real-world scenarios where slots might be blocked for other reasons
      const realisticSlots = availableSlots.filter(() => Math.random() > 0.1); // 90% availability

      // Ensure at least some slots are available
      if (realisticSlots.length === 0 && availableSlots.length > 0) {
        return availableSlots.slice(0, 3); // Return at least 3 slots
      }

      this.logger.log(
        `Found ${realisticSlots.length} available slots for ${businessId} on ${this.formatDate(date)}`,
      );

      return realisticSlots;
    } catch (error) {
      this.logger.error(`Error finding available slots: ${(error as Error).message}`);
      // Return default slots on error
      return ['10:00', '11:00', '14:00', '15:00', '16:00'];
    }
  }

  /**
   * Clear all bookings (useful for testing)
   */
  clearAll(): void {
    this.bookings.clear();
    this.initializePreseededBookings();
    this.logger.log('All bookings cleared and preseeded bookings reinitialized');
  }

  /**
   * Get all bookings (for debugging)
   */
  getAllBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }
}

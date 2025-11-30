import { Booking } from '../entities/booking.entity';

export interface IBookingRepository {
  save(booking: Booking): Promise<Booking>;
  findById(id: string): Promise<Booking | null>;
  findByCustomerId(customerId: string): Promise<Booking[]>;
  findByBusinessId(businessId: string): Promise<Booking[]>;
  findAvailableSlots(businessId: string, date: Date): Promise<string[]>;
}

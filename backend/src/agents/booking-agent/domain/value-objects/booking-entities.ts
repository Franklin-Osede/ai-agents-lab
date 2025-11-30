import { z } from 'zod';
import { Result } from '../../../../core/domain/shared/value-objects/result';

/**
 * Zod schema for BookingEntities validation
 * Used with LangChain StructuredOutputParser for robust extraction
 */
export const BookingEntitiesSchema = z.object({
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'))
    .default([]),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format')).default([]),
  services: z.array(z.string()).default([]),
  location: z.string().optional(),
  people: z.number().int().positive().optional(),
});

export type BookingEntitiesInput = z.infer<typeof BookingEntitiesSchema>;

/**
 * BookingEntities Value Object
 *
 * Represents extracted entities from a booking message.
 * Follows DDD principles: immutable, validated, business logic encapsulation.
 */
export class BookingEntities {
  private constructor(
    public readonly dates: string[],
    public readonly times: string[],
    public readonly services: string[],
    public readonly location?: string,
    public readonly people?: number,
  ) {}

  /**
   * Factory method to create BookingEntities
   * Always returns success - empty arrays for missing fields
   */
  static create(data: Partial<BookingEntities>): Result<BookingEntities> {
    const entities = new BookingEntities(
      data.dates || [],
      data.times || [],
      data.services || [],
      data.location,
      data.people,
    );

    return Result.ok(entities);
  }

  /**
   * Check if any entities were extracted
   */
  hasEntities(): boolean {
    return (
      this.dates.length > 0 ||
      this.times.length > 0 ||
      this.services.length > 0 ||
      !!this.location ||
      !!this.people
    );
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject(): {
    dates: string[];
    times: string[];
    services: string[];
    location?: string;
    people?: number;
  } {
    return {
      dates: this.dates,
      times: this.times,
      services: this.services,
      location: this.location,
      people: this.people,
    };
  }
}

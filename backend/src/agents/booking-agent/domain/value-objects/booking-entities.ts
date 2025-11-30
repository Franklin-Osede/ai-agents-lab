import { Result } from '../../../../core/domain/shared/value-objects/result';

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


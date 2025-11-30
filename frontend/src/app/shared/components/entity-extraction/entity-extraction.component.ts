import { Component, Input } from '@angular/core';
import { BookingEntities } from '../../models/agent.model';

/**
 * EntityExtractionComponent
 * 
 * Displays extracted entities (dates, times, services, location, people) from booking messages.
 * Follows Single Responsibility Principle - only displays entities.
 * 
 * @example
 * <app-entity-extraction [entities]="extractedEntities"></app-entity-extraction>
 */
@Component({
  selector: 'app-entity-extraction',
  templateUrl: './entity-extraction.component.html',
  styleUrls: ['./entity-extraction.component.scss'],
})
export class EntityExtractionComponent {
  @Input() entities?: BookingEntities;

  /**
   * Check if any entities were extracted
   */
  hasEntities(): boolean {
    if (!this.entities) {
      return false;
    }

    return (
      (this.entities.dates?.length ?? 0) > 0 ||
      (this.entities.times?.length ?? 0) > 0 ||
      (this.entities.services?.length ?? 0) > 0 ||
      !!this.entities.location ||
      !!this.entities.people
    );
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  }

  /**
   * Format time for display
   */
  formatTime(time: string): string {
    // If already in HH:mm format, return as is
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }
    return time;
  }
}

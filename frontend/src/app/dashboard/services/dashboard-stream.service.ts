
import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface DashboardEvent {
  type: string;
  payload: any;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardStreamService {
  private eventSource: EventSource | null = null;
  private eventSubject = new Subject<DashboardEvent>();
  
  // Specific Streams
  public events$ = this.eventSubject.asObservable();
  
  private zone = inject(NgZone);



  connect(clientId: string): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    // Connect to the generic broadcast or specific client
    const url = `/api/dashboard/events/${clientId}`; 
    // Note: In development, proxy.conf.json usually maps /api to backend:3000
    // If not using proxy, full URL: http://localhost:3000/dashboard/events/${clientId}
    
    // Using direct URL for now assuming standard setup, adjust if proxy is different
    const directUrl = `http://localhost:3000/dashboard/events/${clientId}`;

    this.eventSource = new EventSource(directUrl);

    this.eventSource.onmessage = (event) => {
      this.zone.run(() => {
        try {
          const parsed = JSON.parse(event.data);
          // Standardize event structure
          this.eventSubject.next(parsed);
        } catch (e) {
          console.error('Error parsing SSE event', e);
        }
      });
    };

    this.eventSource.onerror = (error) => {
      this.zone.run(() => {
        console.error('SSE Connection Error', error);
        // Optional: Reconnection logic
      });
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

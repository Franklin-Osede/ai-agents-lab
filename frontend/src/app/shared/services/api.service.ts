import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgentResponse } from '../models/agent.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3001/api/v1';

  constructor(private http: HttpClient) {}

  processBooking(message: string, businessId: string = 'demo-business'): Observable<AgentResponse> {
    return this.http.post<any>(`${this.baseUrl}/agents/booking/process`, {
      message,
      businessId,
    }).pipe(
      map(response => response.data || response)
    );
  }

  processDm(
    message: string,
    channel: 'INSTAGRAM' | 'WHATSAPP' | 'TELEGRAM' = 'INSTAGRAM',
  ): Observable<AgentResponse> {
    return this.http.post<any>(`${this.baseUrl}/agents/dm-response/process`, {
      message,
      customerId: 'demo-customer',
      businessId: 'demo-business',
      channel,
    }).pipe(
      map(response => response.data || response)
    );
  }

  generateFollowUp(
    lastInteraction: string,
    daysSinceLastContact: number,
  ): Observable<AgentResponse> {
    return this.http.post<any>(`${this.baseUrl}/agents/follow-up/generate`, {
      customerId: 'demo-customer',
      businessId: 'demo-business',
      lastInteraction,
      daysSinceLastContact,
    }).pipe(
      map(response => response.data || response)
    );
  }

  generateVoice(
    context: string,
    includeVideo: boolean = false,
    avatarImageUrl?: string,
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/agents/voice/generate`, {
      customerId: 'demo-customer',
      businessId: 'demo-business',
      context,
      channel: 'WHATSAPP',
      includeVideo,
      avatarImageUrl,
      customerName: 'María',
      language: 'es',
    }).pipe(
      map(response => (response as any).data || response)
    );
  }
}


import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgentResponse } from '../models/agent.model';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl =
    environment.apiBaseUrl || 'http://localhost:3000/api/v1';

  private http = inject(HttpClient);



  processBooking(
    message: string,
    businessId = 'demo-business',
    useDemo = true,
    serviceContext?: any,
    sessionId?: string,
  ): Observable<AgentResponse> {
    // Use demo endpoint if useDemo is true (no API key required)
    const endpoint = useDemo 
      ? `${this.baseUrl}/demo/booking/chat`
      : `${this.baseUrl}/agents/booking/process`;
    
    const body = useDemo
      ? { 
          message, 
          sessionId: sessionId || `demo_${Date.now()}`,
          serviceContext: serviceContext || null, // Include service context
        }
      : { 
          message, 
          businessId,
          customerId: sessionId,
          context: serviceContext || null,
        };
    
    return this.http.post<any>(endpoint, body).pipe(
      map(response => {
        // Handle demo response format
        if (useDemo && response.response) {
          // Try to parse as JSON if it's an enhanced response
          try {
            const parsed = JSON.parse(response.response);
            return {
              success: true,
              message: parsed.response || response.response,
              intent: { type: 'BOOKING', confidence: 0.9 },
              entities: { dates: [], times: [], services: [] },
              toolCalls: parsed.toolCalls || [],
              bookingStatus: parsed.bookingStatus,
              bookingId: parsed.bookingId,
            } as AgentResponse;
          } catch {
            // Not JSON, return as string
            return {
              success: true,
              message: response.response,
              intent: { type: 'BOOKING', confidence: 0.9 },
              entities: { dates: [], times: [], services: [] },
            } as AgentResponse;
          }
        }
        return response.data || response;
      })
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
    includeVideo = false,
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

  captureLead(email: string, name: string, agentId?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/marketing/capture-lead`, {
      email,
      name,
      agentId,
    });
  }
}

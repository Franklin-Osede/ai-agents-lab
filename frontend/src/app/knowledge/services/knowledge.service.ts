import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export interface TrainingProgress {
  status: 'idle' | 'connecting' | 'processing' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  foundItems: { type: string; preview: string }[];
  metadata?: any; 
}

@Injectable({
  providedIn: 'root',
})
export class KnowledgeService {
  private http = inject(HttpClient);
  
  private socket: Socket | null = null;
  public trainingProgress = signal<TrainingProgress>({
    status: 'idle',
    progress: 0,
    currentStep: '',
    foundItems: [],
    metadata: null,
  });


  async startTraining(url: string, tenantId: string): Promise<void> {
    // Reset state
    this.trainingProgress.set({
      status: 'connecting',
      progress: 0,
      currentStep: 'Conectando con tu web...',
      foundItems: [],
    });

    // Connect to WebSocket
    this.connectWebSocket(tenantId);

    // Start backend ingestion
    try {
      const result = await this.http
        .post<{ sourceId: string; status: string; metadata: any }>(
          `${environment.apiBaseUrl}/knowledge/ingest`,
          { url, tenantId }
        )
        .toPromise();

      console.log('Training started/completed:', result);
      
      // Parse response: Backend might wrap it in 'data'
      const responseData = (result as any).data || result;

      // Update state with result (since polling/socket might be delayed or synchronous)
      this.trainingProgress.update((state) => ({
        ...state,
        status: 'completed',
        progress: 100,
        metadata: responseData?.metadata,
      }));

    } catch (error) {
      this.trainingProgress.update((state) => ({
        ...state,
        status: 'error',
        currentStep: 'Error al conectar con el servidor',
      }));
      throw error;
    }
  }

  private connectWebSocket(tenantId: string): void {
    const wsUrl = environment.apiBaseUrl.replace('/api/v1', '');
    this.socket = io(`${wsUrl}/knowledge`, {
      query: { tenantId },
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('knowledge.progress', (payload: any) => {
      console.log('Progress:', payload);
      this.trainingProgress.update((state) => ({
        ...state,
        status: 'processing',
        currentStep: payload.message || 'Procesando...',
        progress: payload.progress || state.progress,
      }));
    });

    this.socket.on('knowledge.content_found', (payload: any) => {
      console.log('Content found:', payload);
      this.trainingProgress.update((state) => ({
        ...state,
        foundItems: [...state.foundItems, payload],
      }));
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

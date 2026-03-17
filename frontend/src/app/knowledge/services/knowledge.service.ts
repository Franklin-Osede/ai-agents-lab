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
  metadata?: {
    branding?: any;
    structuredData?: any;
    team?: any[];
    blogPosts?: { title: string; url: string; date?: string; summary?: string }[];
    faqs?: { question: string; answer: string }[];
    title?: string;
    summary?: string;
    classification?: string;
    screenshot?: string;
    [key: string]: any;
  }; 
}

@Injectable({
  providedIn: 'root',
})
export class KnowledgeService {
  private http = inject(HttpClient);
  
  private socket: Socket | null = null;
  
  // Public writable signal so components can react to changes
  private _trainingProgress = signal<TrainingProgress>({
    status: 'idle',
    progress: 0,
    currentStep: '',
    foundItems: [],
    metadata: undefined,
  });
  
  // Expose as readonly
  public trainingProgress = this._trainingProgress.asReadonly();


  async startTraining(url: string, tenantId: string): Promise<void> {
    // Reset state
    this._trainingProgress.set({
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
      this._trainingProgress.update((state) => ({
        ...state,
        status: 'completed',
        progress: 100,
        metadata: responseData?.metadata,
      }));

    } catch (error) {
      this._trainingProgress.update((state) => ({
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

    this.socket.on('training_progress', (progress: any) => {
      console.log('Progress:', progress);
      this._trainingProgress.update((current) => ({
        ...current,
        status: progress.stage || 'processing', // Assuming 'stage' can map to status, default to 'processing'
        progress: progress.progress,
        currentStep: progress.message,
        // Update metadata if provided (includes screenshot early!)
        metadata: progress.metadata ? { ...current.metadata, ...progress.metadata } : current.metadata,
      }));
    });

    this.socket.on('knowledge.content_found', (payload: any) => {
      console.log('Content found:', payload);
      this._trainingProgress.update((state) => ({
        ...state,
        foundItems: [...state.foundItems, payload],
      }));
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }

  async fetchOrganizationInfo(tenantId: string): Promise<any> {
    const url = `${environment.apiBaseUrl}/knowledge/organization-info/${tenantId}`;
    return this.http.get(url).toPromise();
  }

  async classify(text: string, intents: { intentName: string; keywords?: string[] }[]): Promise<{ intentName: string }> {
      const url = `${environment.apiBaseUrl}/knowledge/classify`;
      return this.http.post<{ intentName: string }>(url, { text, intents }).toPromise().then(res => res!);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

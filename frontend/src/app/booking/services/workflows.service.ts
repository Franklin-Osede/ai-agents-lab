import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkflowsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/workflows`;

  generateWorkflow(sourceId: string, niche: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate`, { sourceId, niche });
  }

  createWorkflow(workflow: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, workflow);
  }

  startSession(workflowId: string, knowledgeSourceId?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${workflowId}/execute`, { knowledgeSourceId });
  }

  submitStep(sessionId: string, input: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sessions/${sessionId}/next`, { input });
  }
}

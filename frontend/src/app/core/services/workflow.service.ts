import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Workflow {
  id: string;
  niche: string;
  name: string;
  activeVersionId: string | null;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  nodes: any[];
  settings: any;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl || 'http://localhost:3000/api/v1';

  /**
   * Create a new workflow (if it doesn't exist)
   */
  createWorkflow(niche: string, name: string): Observable<Workflow> {
    return this.http.post<Workflow>(`${this.baseUrl}/workflows`, { niche, name });
  }

  createFromTemplate(niche: string, templateId: string): Observable<Workflow> {
    return this.http.post<Workflow>(`${this.baseUrl}/workflows/template/${templateId}`, { niche });
  }

  /**
   * Get the latest workflow version structure for a niche
   */
  getWorkflow(niche: string): Observable<{ workflow: Workflow; version: WorkflowVersion | null }> {
    return this.http.get<{ workflow: Workflow; version: WorkflowVersion | null }>(`${this.baseUrl}/workflows/${niche}`);
  }

  getWorkflowById(id: string): Observable<{ workflow: Workflow; version: WorkflowVersion | null }> {
    return this.http.get<{ workflow: Workflow; version: WorkflowVersion | null }>(`${this.baseUrl}/workflows/detail/${id}`);
  }

  /**
   * Save a draft version of the workflow
   */
  saveDraft(workflowId: string, nodes: any[], settings: any): Observable<WorkflowVersion> {
    return this.http.post<WorkflowVersion>(`${this.baseUrl}/workflows/${workflowId}/versions`, {
      nodes,
      settings
    });
  }

  /**
   * Publish the latest draft
   */
  publish(workflowId: string): Observable<Workflow> {
    return this.http.post<Workflow>(`${this.baseUrl}/workflows/${workflowId}/publish`, {});
  }

  /**
   * Start an execution session (for Simulator)
   */
  startSession(workflowId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/workflows/${workflowId}/execute`, {});
  }

  /**
   * Submit input to an active session (for Simulator)
   */
  submitStep(sessionId: string, input: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/workflows/sessions/${sessionId}/next`, { input });
  }

  // --- Preview State (In-Memory) ---
  private previewNodes: any[] = [];

  setPreviewNodes(nodes: any[]) {
    this.previewNodes = nodes;
  }

  getPreviewNodes() {
    return this.previewNodes;
  }
}

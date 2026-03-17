import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TemplateIntent {
  name: string;
  displayName: string;
  icon: string;
  examples?: string[];
  description?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  nicheType: string;
  nicheSubtype?: string;
  defaultIntents: TemplateIntent[];
  isPublic: boolean;
  createdAt: string;
}

export interface TemplateCustomization {
  agentName?: string;
  greeting?: string;
  enabledIntents?: string[];
  customIntents?: {
    name: string;
    displayName: string;
    examples: string[];
    icon?: string;
  }[];
  voiceId?: string;
  primaryColor?: string;
}

export interface CreateWorkflowFromTemplateResponse {
  workflow: {
    id: string;
    niche: string;
    name: string;
  };
  version: {
    id: string;
    versionNumber: number;
  };
  nodes: any[];
}

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/workflows`;

  getTemplatesByNiche(niche: string): Observable<{ data: Template[] }> {
    return this.http
      .get<{ success: boolean; data: { data: Template[] } }>(
        `${this.apiUrl}/templates?niche=${niche}`,
      )
      .pipe(
        map((response) => ({
          data: response.data.data, // Extract nested data array
        })),
      );
  }

  getAllTemplates(): Observable<{ data: Template[] }> {
    return this.http.get<{ data: Template[] }>(`${this.apiUrl}/templates`);
  }

  createWorkflowFromTemplate(
    templateId: string,
    tenantId: string,
    customization: TemplateCustomization,
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/from-template`, {
      templateId,
      tenantId,
      customization,
    });
  }
}

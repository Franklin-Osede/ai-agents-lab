import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TemplateService, Template } from './template.service';
import { environment } from '../../../environments/environment';

describe('TemplateService', () => {
  let service: TemplateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TemplateService],
    });
    service = TestBed.inject(TemplateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get templates by niche', () => {
    const mockTemplates: Template[] = [
      {
        id: '1',
        name: 'Health Template',
        description: 'Template for health',
        nicheType: 'health',
        defaultIntents: [],
        isPublic: true,
        createdAt: new Date().toISOString(),
      },
    ];

    service.getTemplatesByNiche('health').subscribe((response) => {
      expect(response.data).toEqual(mockTemplates);
    });

    const req = httpMock.expectOne(
      `${environment.apiUrl}/workflows/templates?niche=health`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockTemplates });
  });

  it('should create workflow from template', () => {
    const mockResponse = {
      workflow: { id: 'wf-1', niche: 'health', name: 'My Workflow' },
      version: { id: 'v-1', versionNumber: 1 },
      nodes: [],
    };

    service
      .createWorkflowFromTemplate('template-1', 'tenant-1', {
        agentName: 'Dr. García',
      })
      .subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

    const req = httpMock.expectOne(`${environment.apiUrl}/workflows/from-template`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      templateId: 'template-1',
      tenantId: 'tenant-1',
      customization: { agentName: 'Dr. García' },
    });
    req.flush(mockResponse);
  });
});

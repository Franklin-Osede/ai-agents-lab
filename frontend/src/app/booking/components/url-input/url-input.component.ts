import { Component, OnInit, signal, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkflowService } from '../../../core/services/workflow.service';

@Component({
  selector: 'app-url-input',
  templateUrl: './url-input.component.html',
  styleUrls: ['./url-input.component.scss'],
})
export class UrlInputComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  niche = signal('');
  url = signal('');
  isLoading = signal(false);
  error = signal('');
  createdWorkflowId = signal<string | null>(null);

  private workflowService = inject(WorkflowService);

  private subcategoryMap: Record<string, string> = {
    'doctor': 'medical-template',
    'physio': 'medical-template',
    'dental': 'dental-template', // Broad mapping
    'dentist': 'dental-template',
    'dentist_sub': 'dental-template' // Matching NicheSelector ID
  };

  private nicheMap: Record<string, string> = {
    'medical': 'medical-template',
    'dental': 'dental-template',
    'psychology': 'medical-template',
    'demo': 'medical-template' 
  };

  isCreatingTemplate = signal(false);

  ngOnInit() {
    this.route.params.subscribe((params: any) => {
      this.niche.set(params['niche'] || '');
      console.log('[UrlInput] Niche:', this.niche());
    });

    this.route.queryParams.subscribe((queryParams: any) => {
        console.log('[UrlInput] QueryParams received:', queryParams);
        const subcategory = queryParams['subcategory'];
        
        let templateId = null;
        if (subcategory && this.subcategoryMap[subcategory]) {
           templateId = this.subcategoryMap[subcategory];
        } else if (this.niche() && this.nicheMap[this.niche()]) {
           templateId = this.nicheMap[this.niche()];
           console.log('[UrlInput] No subcategory, using niche fallback template:', templateId);
        }

        if (templateId) {
          console.log(`[UrlInput] Auto-creating workflow for template: ${templateId}`);
          this.isCreatingTemplate.set(true); 
          this.workflowService.createFromTemplate(this.niche(), templateId).subscribe({
            next: (wf: any) => {
               console.log('[UrlInput] Template created/loaded FULL OBJECT:', JSON.stringify(wf));
               
               // Check if it's wrapped
               const id = wf.id || wf.data?.id || (wf.workflow && wf.workflow.id);
               
               if (id) {
                   console.log('[UrlInput] ID extracted found:', id);
                   this.createdWorkflowId.set(id);
               } else {
                   console.error('[UrlInput] CRITICAL: No ID found in response!', wf);
               }
               
               this.isCreatingTemplate.set(false); 
            },
            error: (err: any) => {
                console.error('[UrlInput] Error loading template:', err);
                this.isCreatingTemplate.set(false);
            }
          });
        } else {
             console.warn('[UrlInput] No template could be determined from subcategory or niche.');
        }
    });
  }

  isValidUrl(): boolean {
    try {
      const urlObj = new URL(this.url());
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  onSubmit() {
    if (!this.isValidUrl()) {
      this.error.set('Por favor, introduce una URL válida');
      return;
    }

    if (this.isCreatingTemplate()) {
        this.isLoading.set(true); 
        return; 
    }

    // Safety Check: If no ID, try one last time or warn
    if (!this.createdWorkflowId()) {
         console.warn('[UrlInput] Submitting without Workflow ID! Attempting emergency creation...');
         // Emergency sync creation attempt? We can't do sync Http.
         // We'll just define a default.
         const fallbackTemplate = 'medical-template';
         this.isCreatingTemplate.set(true);
         this.workflowService.createFromTemplate(this.niche(), fallbackTemplate).subscribe({
             next: (wf: any) => {
                 console.log('[UrlInput] Emergency Template created FULL OBJECT:', JSON.stringify(wf));
                 const id = wf.id || wf.data?.id || (wf.workflow && wf.workflow.id);
                 if (id) {
                    this.createdWorkflowId.set(id);
                 } else {
                    console.error('[UrlInput] Emergency: No ID found!', wf);
                 }
                 this.isCreatingTemplate.set(false);
                 this.proceedNavigation();
             },
             error: (err) => {
                 console.error('Critical: Failed to create emergency template', err);
                 this.isCreatingTemplate.set(false);
                 // Navigate anyway?
                 this.proceedNavigation();
             }
         });
         return;
    }

    this.proceedNavigation();
  }

  private proceedNavigation() {
    this.error.set('');
    this.isLoading.set(true);

    const targetWorkflowId = this.createdWorkflowId();
    console.log('[UrlInput] Navigating to training with Workflow ID:', targetWorkflowId);

    // Navigate to training screen with URL as query param
    this.router.navigate(['/booking', this.niche(), 'training'], {
      queryParams: {
        url: this.url(),
        workflowId: targetWorkflowId
      },
    });
  }

  useDemoData() {
    this.url.set('https://example.com');
    this.onSubmit();
  }

  goBack() {
    this.router.navigate(['/booking', 'select-niche']);
  }
}

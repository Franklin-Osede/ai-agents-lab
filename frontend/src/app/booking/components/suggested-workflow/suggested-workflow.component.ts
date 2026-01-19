import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowsService } from '../../services/workflows.service';

interface WorkflowNode {
  id: string;
  type: string;
  label?: string;
  data?: {
    text?: string;
    [key: string]: any;
  };
}

interface Workflow {
  nodes: WorkflowNode[];
  niche: string;
  sourceId: string;
  [key: string]: any;
}

@Component({
  selector: 'app-suggested-workflow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suggested-workflow.component.html',
  styleUrls: ['./suggested-workflow.component.scss']
})
export class SuggestedWorkflowComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workflowsService = inject(WorkflowsService);

  isLoading = signal(true);
  workflow = signal<Workflow | null>(null);
  params = signal<any>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const niche = params.get('niche');
      const sourceId = history.state.sourceId || 'demo-source'; // Fallback for testing
      
      this.params.set({ niche, sourceId });

      if (niche && sourceId) {
        this.generate(sourceId, niche);
      } else {
        // Handle error or redirect
        this.isLoading.set(false);
      }
    });
  }

  generate(sourceId: string, niche: string) {
    this.workflowsService.generateWorkflow(sourceId, niche).subscribe({
      next: (res) => {
        this.workflow.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Generation failed', err);
        this.isLoading.set(false);
      }
    });
  }

  useWorkflow() {
    // Navigate to Runner or Dashboard with this workflow active
    // For now, let's go to the Runner
    this.router.navigate(['/booking', this.params().niche, 'run'], {
      state: { workflow: this.workflow() }
    });
  }

  customizeWorkflow() {
    // Navigate to Builder with this workflow loaded
    this.router.navigate(['/booking', this.params().niche, 'builder'], {
      state: { workflow: this.workflow() }
    });
  }
}

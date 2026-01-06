import { Component, OnInit, OnDestroy, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { KnowledgeService } from '../services/knowledge.service';

@Component({
  selector: 'app-training-overlay',
  templateUrl: './training-overlay.component.html',
  styleUrls: ['./training-overlay.component.css'],
})
export class TrainingOverlayComponent implements OnInit, OnDestroy {
  private knowledgeService = inject(KnowledgeService);
  private router = inject(Router);

  progress = signal(0);
  logs = signal<string[]>([]);
  checklist = signal([
    { label: 'Conectando con el sitio web', completed: false },
    { label: 'Analizando estructura', completed: false },
    { label: 'Identificando servicios', completed: false },
    { label: 'Extrayendo información de contacto', completed: false },
    { label: 'Generando conocimiento', completed: false },
  ]);

  ngOnInit() {
    // Listen to real progress from KnowledgeService
    effect(() => {
      const trainingProgress = this.knowledgeService.trainingProgress();
      
      // Update progress
      this.progress.set(trainingProgress.progress);
      
      // Update logs
      if (trainingProgress.currentStep) {
        this.logs.update(logs => [...logs, `> ${trainingProgress.currentStep}`]);
      }
      
      // Update checklist based on progress
      const progressValue = trainingProgress.progress;
      this.checklist.update(list =>
        list.map((item, index) => ({
          ...item,
          completed: progressValue >= (index + 1) * 20
        }))
      );
      
      // Navigate to preview when completed
      if (trainingProgress.status === 'completed' && trainingProgress.progress === 100) {
        setTimeout(() => {
          // Navigate to knowledge preview with metadata in state
          this.router.navigate(['/booking/knowledge-preview'], {
            state: { metadata: trainingProgress.metadata }
          });
        }, 1500);
      }
    });
  }

  ngOnDestroy() {
    this.knowledgeService.disconnect();
  }
}

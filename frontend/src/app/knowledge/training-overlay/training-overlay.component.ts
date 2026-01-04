import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
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
    { label: 'Conectando con tu web', completed: false },
    { label: 'Leyendo contenido', completed: false },
    { label: 'Identificando servicios', completed: false },
    { label: 'Analizando precios', completed: false },
    { label: 'Configurando agente', completed: false },
  ]);

  ngOnInit() {
    // Subscribe to training progress
    const progressSignal = this.knowledgeService.trainingProgress;
    
    // Simulate progress for demo (will be replaced with real WebSocket data)
    this.simulateTraining();
  }

  ngOnDestroy() {
    this.knowledgeService.disconnect();
  }

  private simulateTraining() {
    const steps = [
      { log: '> Conectando con servidor...', progress: 10, checklistIndex: 0 },
      { log: '> Escaneando página principal...', progress: 25, checklistIndex: 1 },
      { log: '> ENCONTRADO: Sección de servicios', progress: 40, checklistIndex: 2 },
      { log: '> Detectado: Fisioterapia Deportiva - 50€', progress: 55, checklistIndex: 2 },
      { log: '> Detectado: Masaje Terapéutico - 40€', progress: 65, checklistIndex: 3 },
      { log: '> Analizando horarios...', progress: 75, checklistIndex: 3 },
      { log: '> Generando base de conocimiento...', progress: 90, checklistIndex: 4 },
      { log: '✓ Entrenamiento completado', progress: 100, checklistIndex: 4 },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          this.router.navigate(['/rider/chat']); // Navigate to chat
        }, 1000);
        return;
      }

      const step = steps[currentStep];
      this.logs.update((logs) => [...logs, step.log]);
      this.progress.set(step.progress);
      
      this.checklist.update((list) =>
        list.map((item, index) => ({
          ...item,
          completed: index <= step.checklistIndex,
        }))
      );

      currentStep++;
    }, 800);
  }
}

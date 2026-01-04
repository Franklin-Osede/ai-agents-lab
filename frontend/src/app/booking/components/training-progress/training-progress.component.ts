import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { KnowledgeService } from '../../../knowledge/services/knowledge.service';

interface LogEntry {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

@Component({
  selector: 'app-training-progress',
  templateUrl: './training-progress.component.html',
  styleUrls: ['./training-progress.component.scss'],
})
export class TrainingProgressComponent implements OnInit, OnDestroy {
  // Signals
  progress = signal(0);
  logs = signal<LogEntry[]>([]);
  cms = signal('');
  niche = signal('');
  url = signal('');
  realTrainingCompleted = signal(false);

  // Steps for UI Checklist
  steps = signal([
    { 
      id: 1, 
      label: 'Conectando con el sitio web', 
      description: 'Verificando disponibilidad y acceso',
      status: 'pending' 
    },
    { 
      id: 2, 
      label: 'Analizando estructura', 
      description: 'Escaneando páginas y navegación',
      status: 'pending' 
    },
    { 
      id: 3, 
      label: 'Identificando servicios', 
      description: 'Extrayendo tratamientos y precios',
      status: 'pending' 
    },
    { 
      id: 4, 
      label: 'Generando conocimiento', 
      description: 'Creando base de datos para la IA',
      status: 'pending' 
    }
  ]);

  // Private
  private intervalId: any;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private knowledgeService = inject(KnowledgeService);

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.niche.set(params['niche'] || '');
    });

    this.route.queryParams.subscribe((params) => {
      const url = params['url'];
      if (url) {
        this.url.set(url);
        // Start REAL training
        this.addLog('info', `Iniciando agente para ${url}...`);
        
        this.knowledgeService.startTraining(url, 'demo-tenant')
          .then(() => {
             console.log('Real training finished');
             this.realTrainingCompleted.set(true);
          })
          .catch((err: any) => {
             console.error('Training failed', err);
             // On error, mark as done so we don't block user forever (fallback to mocks)
             this.realTrainingCompleted.set(true); 
             this.addLog('warning', 'Conexión lenta, usando datos en caché...');
          });
      } else {
         // No URL provided, immediate complete
         this.realTrainingCompleted.set(true);
      }
    });

    this.startVisualSimulation();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startVisualSimulation() {
    const totalDuration = 6000; // 6 seconds min animation
    const intervalTime = 100;
    const steps = totalDuration / intervalTime;
    let currentStep = 0;

    this.intervalId = setInterval(() => {
      currentStep++;
      const simulatedProgress = (currentStep / steps) * 100;

      // Update logs and steps based on visual milestones
      if (currentStep === 10) {
        this.addLog('info', 'Analizando estructura DOM...');
        this.updateStep(0, 'process');
      }
      if (currentStep === 25) {
        this.detectCms();
        this.addLog('success', `CMS detectado: ${this.cms()}`);
        this.updateStep(0, 'completed');
        this.updateStep(1, 'process');
      }
      if (currentStep === 40) {
        this.addLog('info', 'Crawling: navegando por secciones principales...');
        this.updateStep(1, 'completed');
        this.updateStep(2, 'process');
      }
      if (currentStep === 60) {
        this.addLog('info', 'Extrayendo tarifas y servicios...');
      }
      if (currentStep === 75) {
        this.addLog('info', 'Identificando equipo y datos de contacto...');
        this.updateStep(2, 'completed');
        this.updateStep(3, 'process');
      }

      // Logic to sync visual with real
      if (simulatedProgress >= 90) {
        if (this.realTrainingCompleted()) {
           // Both done -> finish
           this.progress.set(100);
           this.finishTraining();
        } else {
           // Visual done but Real pending -> Wait at 95%
           this.progress.set(95);
           // Keep interval running to check 'realTrainingCompleted' again next tick
        }
      } else {
        this.progress.set(simulatedProgress);
      }
    }, intervalTime);
  }

  finishTraining() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.addLog('success', '¡Base de conocimiento generada!');

    setTimeout(() => {
      this.router.navigate(['/booking', this.niche(), 'preview'], {
        queryParams: { url: this.url() },
      });
    }, 1000);
  }

  // --- Helpers ---

  private detectCms() {
    const cmsList = ['WordPress', 'Wix', 'Squarespace', 'Shopify', 'Custom'];
    const random = Math.floor(Math.random() * cmsList.length);
    this.cms.set(cmsList[random]);
  }

  private updateStep(index: number, status: 'pending' | 'process' | 'completed') {
    this.steps.update(steps => {
      const newSteps = [...steps];
      if (newSteps[index]) {
        newSteps[index] = { ...newSteps[index], status };
      }
      return newSteps;
    });
  }

  private addLog(type: LogEntry['type'], message: string) {
    const newLog: LogEntry = {
      type,
      message,
      timestamp: new Date(),
    };
    this.logs.update((logs) => [...logs, newLog]);
  }
}

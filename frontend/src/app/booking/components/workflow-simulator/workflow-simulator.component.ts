import { Component, OnInit, inject, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowService, Workflow, WorkflowVersion } from '../../../core/services/workflow.service';

interface ChatMessage {
  id: string;
  sender: 'agent' | 'user' | 'system';
  type: 'text' | 'options' | 'input-request' | 'voicenote';
  content: string;
  metadata?: any;
  timestamp: Date;
}

@Component({
  selector: 'app-workflow-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workflow-simulator.component.html',
  styleUrls: ['./workflow-simulator.component.scss']
})
export class WorkflowSimulatorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workflowService = inject(WorkflowService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  niche = signal('');
  workflow = signal<Workflow | null>(null);
  sessionId = signal<string | null>(null);
  isLoading = signal(false);
  
  messages = signal<ChatMessage[]>([]);
  userInput = signal('');
  
  // Current state of interaction
  isWaitingForInput = signal(false);
  currentOptions = signal<{label: string, value: any}[] | null>(null);

  constructor() {
    // Scroll to bottom effect
    effect(() => {
      this.messages();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.niche.set(params['niche']);
    });
    
    this.route.queryParams.subscribe(queryParams => {
        const workflowId = queryParams['workflowId'];
        if (workflowId) {
            console.log(' Using specific Workflow ID:', workflowId);
            // If we have a specific ID, use it directly
            this.isLoading.set(true);
            this.workflowService.getWorkflow(this.niche()).subscribe(data => {
                 // ideally we should get by ID, but getWorkflow(niche) returns active one.
                 // let's assume getWorkflow returns the correct active one or we just start execution with the ID we have.
                 this.workflow.set(data.workflow); // Set metadata if available
                 this.startExecution(workflowId);
            });
        } else {
             this.initializeSession();
        }
    });
  }

  initializeSession() {
    const niche = this.niche();
    if (!niche) return;

    this.isLoading.set(true);
    this.messages.set([]);
    
    // 1. Get Workflow ID
    this.workflowService.getWorkflow(niche).subscribe({
      next: (data) => {
        this.workflow.set(data.workflow);
        if (data.workflow && data.workflow.id) {
          // 2. Start Execution
          this.startExecution(data.workflow.id);
        } else {
           this.addSystemMessage('No se encontró un workflow activo para este nicho.');
           this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.addSystemMessage('Error al cargar el workflow.');
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  startExecution(workflowId: string) {
    this.workflowService.startSession(workflowId).subscribe({
      next: (response) => {
        this.sessionId.set(response.sessionId);
        this.processResponse(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.addSystemMessage('Error al iniciar la sesión de prueba.');
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  sendMessage() {
    if (!this.userInput().trim() || !this.sessionId()) return;

    const text = this.userInput();
    this.addUserMessage(text);
    this.userInput.set('');
    this.isWaitingForInput.set(false);
    this.currentOptions.set(null); // Clear options if typed input provided

    this.submitStep({ text });
  }

  selectOption(option: any) {
    if (!this.sessionId()) return;
    
    this.addUserMessage(option.label || option);
    this.isWaitingForInput.set(false);
    this.currentOptions.set(null);

    this.submitStep({ text: option.value || option.label || option });
  }

  submitStep(input: any) {
    this.isLoading.set(true);
    const sessionId = this.sessionId();
    if (!sessionId) return;

    this.workflowService.submitStep(sessionId, input).subscribe({
      next: (response) => {
        this.processResponse(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.addSystemMessage('Error al procesar tu respuesta.');
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  processResponse(response: any) {
    // Determine response type and add agent message
    if (response.result && response.result.response) {
      const resp = response.result.response;
      
      if (resp.type === 'voicenote') {
        this.addAgentMessage(resp.text || 'Nota de voz sin transcripción', 'voicenote', resp);
      } else if (resp.type === 'userresponse') {
        // Did we get options?
        if (resp.chips && resp.chips.length > 0) {
            this.currentOptions.set(resp.chips.map((c: any) => ({ label: c.text, value: c.text })));
        }
        this.isWaitingForInput.set(true);
        // Note: UserResponse node usually doesn't output text immediately, it WAITS.
        // But if it has a prompt, we might show it.
      } else if (resp.type === 'message') {
          this.addAgentMessage(resp.text || 'Sin mensaje');
      } else if (resp.type === 'form') {
           this.addAgentMessage('Por favor completa el siguiente formulario:', 'text');
           // In a real app, we would render the form fields. For sim, we just ask for text inputs sequentially or abstract it.
           // Simplified:
           this.isWaitingForInput.set(true);
      }
      
      // If the execution finished
      if (response.result.isCompleted) {
          this.addSystemMessage('🏁 Workflow completado.');
          this.isWaitingForInput.set(false);
      }
    }
  }

  // Helpers
  addAgentMessage(content: string, type: ChatMessage['type'] = 'text', metadata?: any) {
    this.messages.update(msgs => [...msgs, {
      id: Date.now().toString(),
      sender: 'agent',
      type,
      content,
      metadata,
      timestamp: new Date()
    }]);
  }

  addUserMessage(content: string) {
    this.messages.update(msgs => [...msgs, {
      id: Date.now().toString(),
      sender: 'user',
      type: 'text',
      content,
      timestamp: new Date()
    }]);
  }

  addSystemMessage(content: string) {
    this.messages.update(msgs => [...msgs, {
      id: Date.now().toString(),
      sender: 'system',
      type: 'text',
      content,
      timestamp: new Date()
    }]);
  }

  scrollToBottom() {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  goBack() {
    this.router.navigate(['/booking', this.niche(), 'builder']);
  }
}

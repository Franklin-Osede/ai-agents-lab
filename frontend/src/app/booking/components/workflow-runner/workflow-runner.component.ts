import { Component, OnInit, signal, inject, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkflowsService } from '../../services/workflows.service'; // Use the new Booking Service
import { VoiceService } from '../../../core/services/voice.service';
import { WorkflowNode } from '../workflow-builder/workflow-builder.component'; // Import type
import { KnowledgeService } from '../../../knowledge/services/knowledge.service';
import { BodyMapComponent } from '../../../shared/components/body-map/body-map.component';
import { ConditionEvaluatorService } from '../../../core/services/condition-evaluator.service';

import { ServiceSelectorComponent, Service } from '../../../shared/components/service-selector/service-selector.component';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-workflow-runner',
  standalone: true,
  imports: [CommonModule, FormsModule, BodyMapComponent, ServiceSelectorComponent],
  templateUrl: './workflow-runner.component.html',
  styleUrls: ['./workflow-runner.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    // ... other animations
  ]
})
export class WorkflowRunnerComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private workflowsService = inject(WorkflowsService); // Injected new service
  private voiceService = inject(VoiceService);
  private knowledgeService = inject(KnowledgeService);
  private conditionEvaluator = inject(ConditionEvaluatorService);

  // State
  nodes: WorkflowNode[] = [];
  currentNode = signal<WorkflowNode | null>(null);
  
  // Variables State
  variables = signal<Record<string, any>>({});
  
  // UI State
  isPlayingAudio = signal(false);
  isLoading = signal(false);
  isPaymentProcessing = signal(false); // Payment State
  // transcript now supports 'system' for inline components
  transcript = signal<{ sender: 'agent'|'user'|'system', text?: string, component?: string, data?: any }[]>([]);
  
  // Calendar State (Mock)
  selectedDay = signal(15);
  mockTimes = [
    { time: '09:00', available: true },
    { time: '09:30', available: true },
    { time: '10:00', available: false },
    { time: '11:00', available: true },
    { time: '13:00', available: false },
    { time: '16:00', available: true },
  ];
  
  // Professional Data
  professionals = signal<any[]>([]);
  
  // Services Data
  services = signal<any[]>([]);

  // RAG State
  isSearching = signal(false);

  // Audio Player
  private currentSound: HTMLAudioElement | null = null;

  // Scroll
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // Session State
  sessionId = signal<string | null>(null);

  constructor() {
    // Effect to handle Side Effects when node changes
    effect(() => {
      const node = this.currentNode();
      if (!node) return;

      this.isLoading.set(false);
      
      // --- AUTO-ADVANCE NODES (Add to history + Move on) ---
      
      if (node.type === 'voicenote' && node.data?.text) {
        const processedText = this.replaceVariables(node.data.text);
        this.addTranscript('agent', processedText);
        const voiceId = node.data.voiceId || (node.data.voiceGender === 'male' ? 'Sergio' : 'Lucia');
        this.playAudio(processedText, voiceId);
        
      } else if (node.type === 'message' && node.data?.text) {
         const processedText = this.replaceVariables(node.data.text);
         this.addTranscript('agent', processedText);
         this.stopAudio();
         // Wait a bit then move on if it's purely informational? 
         // For server-driven, usually the server tells us if we need to wait or not via 'nextStepAvailable'
         // But for now, let's keep the timeout unless specific instructions
         // setTimeout(() => this.nextStep(), 1500); 
         // Actually, let's wait for audio or just timeout
         setTimeout(() => {
             // In server driven, we probably automatically ack? 
             // Or we just wait for user? 
             // Let's assume informational message -> auto next
             this.submitStep({}); 
         }, 1500);

      // --- INLINE INTERACTIVE NODES (Chat Stream) ---
      
      } else if (node.type === 'userresponse') {
          // Add Inline Chips Message
          this.stopAudio();
          this.transcript.update(log => [...log, { 
              sender: 'system', 
              component: 'chips', 
              data: { chips: node.data?.chips || [] } 
          }]);
      
      } else if (node.type === 'smartlisten') {
          // Wait for user audio
          this.stopAudio();
          this.isListening.set(false);
          // Show recording UI in chat (System component)
          this.transcript.update(log => [...log, {
              sender: 'system',
              component: 'smartlisten',
              data: {} 
          }]);
          
      // --- BOTTOM SHEET INTERACTIVE NODES (Widgets) ---
          
      } else if (node.type === 'calendar' || node.type === 'form' || node.type === 'professional' || node.type === 'services') {
          // Just show widget.
          this.stopAudio();

      } else if (node.type === 'bodymap') {
          this.stopAudio();
          this.transcript.update(log => [...log, {
              sender: 'system',
              component: 'bodymap',
              data: { view: node.data?.bodyView || 'front' }
          }]);
          // Note: we don't call nextStep() yet, we wait for selection
          
      } else if (node.type === 'ragsearch') {
          this.stopAudio();
          this.isSearching.set(true);
          
          // Use search query from data
          const query = this.replaceVariables(node.data?.searchQuery || 'Tratamientos para {body_part}');
          
          // In Server-Driven, this 'ragsearch' node probably wouldn't even reach the client
          // The SERVER would execute it and just return the result (text message).
          // But if we do receive it, we treat it as an informational step or auto-submit?
          // Let's assume we just auto-submit to let server do the work?
          // Or maybe this is a "Client Side RAG"? 
          // For Phase 4, let's assume server handles logic, so if we see this, we just ack.
           this.submitStep({ action: 'ack' });

      } else if (node.type === 'condition') {
          // Client shouldn't see condition nodes in server-driven flow usually
          // But if we do, we just ack
          this.submitStep({ action: 'ack' });
          
      } else if (node.type === 'payment') {
          this.stopAudio();
          // Just waiting for user interaction in the Bottom Sheet
          console.log('Waiting for payment...');
          
      } else {
        console.warn('Unknown node type or empty text:', node.type);
        this.stopAudio();
        // this.nextStep();
      }
    }, { allowSignalWrites: true });

    // Auto Scroll Effect
    effect(() => {
        this.transcript(); // dependency
        setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  scrollToBottom() {
      if (this.scrollContainer) {
          this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
  }

  addTranscript(sender: 'agent'|'user'|'system', text: string) {
      this.transcript.update(log => [...log, { sender, text }]);
  }

  // State for recording
  isListening = signal(false);
  smartListenText = signal(''); // Typed text

  submitSmartListenText() {
    const text = this.smartListenText().trim();
    if (!text) return;
    
    this.smartListenText.set(''); // Clear input
    this.handleSmartListenResult(text);
  }

  startListening() {
      // Browser Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          alert('Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome.');
          return;
      }

      this.isListening.set(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.start();

      recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          console.log('Recognized text:', text);
          this.isListening.set(false);
          this.handleSmartListenResult(text);
          recognition.stop();
      };

      recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          this.isListening.set(false);
          alert('Error al escuchar. Inténtalo de nuevo.');
      };
      
      recognition.onend = () => {
          this.isListening.set(false);
      };
  }

  handleSmartListenResult(text: string) {
      // 1. Remove System UI
      this.transcript.update(log => log.filter(msg => msg.component !== 'smartlisten'));
      
      // 2. Add User Text
      this.addTranscript('user', text);
      
      // 3. Submit to Backend
      this.submitStep({ input: text });
  }

  // Updated Finder Logic - supports returning to parent flow
  findNextNode(list: WorkflowNode[], currentId: string, parentNext?: WorkflowNode): { found: boolean, next?: WorkflowNode } {
      // Client side finding logic is removed/deprecated for server-driven
      return { found: false }; 
  }

  ngOnInit() {
    // 1. Get Workflow/Source Info from State
    const navigationState = history.state;
    const workflow = navigationState.workflow;

    if (workflow && workflow.id) {
      console.log('Starting Session for Workflow:', workflow.id);
      this.isLoading.set(true);
      
      this.workflowsService.startSession(workflow.id, workflow.sourceId).subscribe({
        next: (response) => {
           console.log('Session Started:', response);
           this.processBackendResponse(response);
        },
        error: (err) => {
          console.error('Failed to start session', err);
          this.isLoading.set(false);
          this.addTranscript('system', 'Error al iniciar sesión con el servidor.');
        }
      });
    } else {
      console.warn('No workflow ID found in state. Mock mode?');
      // maybe redirect back?
    }
  }

  // New Method to Process Backend Response
  processBackendResponse(response: any) {
     if (!response || !response.process) return;

     const { sessionId, current, nextStepAvailable } = response.process;
     
     if (sessionId) {
       this.sessionId.set(sessionId);
     }

     if (!current) {
        return;
     }
     
     const node: WorkflowNode = {
         id: current.id || 'server-node',
         type: current.type,
         label: 'Server Node', // Dummy
         position: { x: 0, y: 0 }, // Dummy
         data: { ...current }
     };
     
     this.currentNode.set(node);
  }

  // New Method to Submit Step
  submitStep(input: any) {
      const sessionId = this.sessionId();
      if (!sessionId) {
          console.error('No session ID');
          return;
      }

      this.isLoading.set(true); // Show spinner?
      
      this.workflowsService.submitStep(sessionId, input).subscribe({
          next: (response) => {
              this.processBackendResponse(response);
          },
          error: (err) => {
              console.error('Step submission failed', err);
              this.isLoading.set(false);
          }
      });
  }



  playAudio(text: string, voiceId: string) {
    this.stopAudio(); // Reset state first
    this.isPlayingAudio.set(true); // Now signify loading/playing
    
    console.log('Requesting audio for:', text);

    this.voiceService.speak(text, voiceId).subscribe({
        next: (url) => {
            if (!url) {
                console.error('TTS failed, skipping audio');
                this.isPlayingAudio.set(false);
                this.handleAudioEnded(); // Auto-advance on error
                return;
            }
            
            console.log('Audio URL received, playing...');
            this.currentSound = new Audio(url);
            
            this.currentSound.onended = () => {
                console.log('Audio ended normally');
                this.isPlayingAudio.set(false);
                this.handleAudioEnded();
            };
            
            this.currentSound.onerror = (e) => {
                console.error('Audio playback error', e);
                this.isPlayingAudio.set(false);
                this.handleAudioEnded(); // Auto-advance on playback error
            };

            this.currentSound.play().catch(err => {
                console.error('Play prevented (autoplay policy?)', err);
                this.isPlayingAudio.set(false);
                this.handleAudioEnded(); // Auto-advance if play fails
            });
        },
        error: (err) => {
            console.error('Voice Service Error', err);
            this.isPlayingAudio.set(false);
            this.handleAudioEnded();
        }
    });
  }

  handleAudioEnded() {
     // If it's pure voice note with no user interaction needed, maybe auto advance?
     // But usually followed by UserResponse or logic.
     // Getting the 'next' node is tricky in a flat list without explicit links if using implicit ordering.
     // In our builder: 'UserResponse' has chips with 'nextSteps'. 
     // A linear 'VoiceNote' might just flow to the text in next index??
     
     // Current builder logic implies: Root List -> Sequence.
     // Nested chips -> Branches.
     // So if node is in a list, next is list[i+1].
     
     const current = this.currentNode();
     if (current && current.type === 'voicenote') {
         // Auto advance after 1s
         setTimeout(() => this.nextStep(), 1000);
     }
  }

  stopAudio() {
    if (this.currentSound) {
        this.currentSound.pause();
        this.currentSound = null;
    }
    this.isPlayingAudio.set(false);
  }

  // --- Navigation Logic ---

  nextStep() {
    // Server-driven: Just submit an empty step (ack) or wait
    this.submitStep({});
  }

  handleOptionClick(chip: any, index: number) {
      // 1. Remove the "System Chips" message from transcript
      this.transcript.update(log => log.filter(msg => msg.component !== 'chips'));

      // 2. Add user selection
      this.addTranscript('user', chip.text);
      
      // 3. Submit to server
      this.submitStep({ input: chip.text, value: chip.value });
  }
  


  // Actions
  selectTime(time: string) {
      // alert(`Hora seleccionada: ${time}.`);
      this.submitStep({ action: 'book_slot', slot: time });
  }

  restart() {
      this.stopAudio();
      this.transcript.set([]);
      this.ngOnInit(); // Re-init
  }

  goBack() {
      this.stopAudio();
      this.router.navigate(['../builder'], { relativeTo: this.route });
  }

  // Helper to handle service selection from the rich component
  handleServiceSelected(service: Service) {
      console.log('Service Selected:', service);
      
      // Log the selection
      this.addTranscript('user', `Quiero contratar: ${service.name}`);
      
      // Save variable
      this.setVariable('selected_service', service.name);
      this.setVariable('service_price', service.price);
      
      // Advance
      this.submitStep({ input: service.name, variable: 'selected_service', value: service });
  }

  // Body Map Logic
  handleBodyPartSelected(part: string) {
    console.log('Body Part Selected:', part);
    
    // 1. Remove bodymap log if exists to avoid clutter
    this.transcript.update(log => log.filter(msg => msg.component !== 'bodymap'));
    
    // 2. Logic for Success Message
    const currentNode = this.currentNode();
    // Check if node has a custom success message
    const customMessage = currentNode?.data?.successMessage;
    
    if (customMessage) {
         // Agent speaks the custom confirmation
         this.addTranscript('agent', customMessage);
         // Optionally speak it if voice is on
         // Assuming 'playVoice' is a typo for 'playAudio' and 'currentVoiceId' should be derived or a default
         const voiceId = currentNode?.data?.voiceId || 'Lucia'; // Use node's voiceId or default
         if (voiceId) { // Check if a voiceId is available (even if default)
             this.playAudio(customMessage, voiceId);
         }
         
         // User log: just the part name or "He marcado X"
         this.addTranscript('user', `He marcado: ${part}`);
    } else {
        // Fallback default behavior
        this.addTranscript('user', `Me duele: ${part}`);
    }
    
    // Save Variable {body_part}
    this.setVariable('body_part', part);
    
      // 3. Advance (Submit to server)
    this.submitStep({ input: part, variable: 'body_part', value: part });
  }

  toggleBodyMapView(index: number) {
     this.transcript.update(log => {
         const newLog = [...log];
         if (newLog[index] && newLog[index].component === 'bodymap' && newLog[index].data) {
             const currentView = newLog[index].data.view;
             newLog[index] = {
                 ...newLog[index],
                 data: { ...newLog[index].data, view: currentView === 'front' ? 'back' : 'front' }
             };
         }
         return newLog;
     });
  }

  // Payment Logic
  processPayment() {
      this.isPaymentProcessing.set(true);
      
      // Simulate API call
      setTimeout(() => {
          this.isPaymentProcessing.set(false);
          this.addTranscript('system', 'Pago realizado con éxito ✅');
          this.submitStep({ action: 'payment_success' });
      }, 2000);
  }
  
  // --- Variable System ---
  
  setVariable(key: string, value: any) {
      this.variables.update(vars => ({ ...vars, [key]: value }));
      console.log('Variables updated:', this.variables());
  }
  
  replaceVariables(text: string): string {
      let processed = text;
      const vars = this.variables();
      
      // Regex to find {variable_name}
      processed = processed.replace(/\{([^}]+)\}/g, (match, key) => {
          return vars[key] !== undefined ? vars[key] : match; // Keep original if not found
      });
      
      return processed;
  }

  finishFlow() {
      // Show restart or exit
      this.addTranscript('agent', "¡Gracias! Flujo completado.");
  }
}

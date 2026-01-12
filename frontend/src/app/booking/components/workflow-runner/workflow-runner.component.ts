import { Component, OnInit, signal, inject, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkflowService } from '../../../core/services/workflow.service';
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
  private workflowService = inject(WorkflowService);
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
         setTimeout(() => this.nextStep(), 1500);

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
          
          // Get query or use default
          const query = this.replaceVariables(node.data?.searchQuery || 'Tratamientos para {body_part}');
          
          setTimeout(() => {
              this.isSearching.set(false);
              
              // MOCK RAG RESPONSE
              const bodyPart = this.variables()['body_part'] || 'la zona afectada';
              const diagnosis = `He analizado nuestra base de conocimientos sobre **${bodyPart}**. Podría tratarse de una sobrecarga o tendinitis. Tenemos especialistas en traumatología deportiva que pueden ayudarte.`;
              
              this.addTranscript('agent', diagnosis);
              this.playAudio(diagnosis, 'Lucia'); // Read it out loud
              this.nextStep();
          }, 2500); // Simulate network delay
          

      } else if (node.type === 'condition') {
          this.stopAudio();
          const { variable, operator, value } = node.data || {};
          // Evaluate Logic
          const result = this.conditionEvaluator.evaluate(
              this.variables()[variable || ''], 
              operator || '==', 
              value
          );
          
          console.log(`Condition Result: ${result} (True Branch: ${node.data?.trueBranch?.length}, False Branch: ${node.data?.falseBranch?.length})`);
          
          // Determine path
          const branch = result ? node.data?.trueBranch : node.data?.falseBranch;
          
          if (branch && branch.length > 0) {
              // Inject branch nodes dynamically right after this one? 
              // NO, simpler: The branch BECOMES the next steps. 
              // We need to inject them into the 'nodes' array or just navigate to the first one?
              // Given our linear runner, we likely need to splicing them in or setting them as active.
              // SIMPLIFICATION: We just set the first node of the branch as active.
              // BUT linear flow expects a list. 
              // TRICK: We replace the rest of the flow with the branch content? 
              // OR better: We handle it recursively like NextJS.
              
              // For this MVP, let's just REPLACE the remaining nodes with the branch nodes + (rest of flow?)
              // Actually, in the Builder structure, the branch IS the flow.
              this.nodes = branch; // Switch context to this branch?
              this.currentNode.set(branch[0]);
          } else {
             // If no branch, just continue? or End?
             this.finishFlow();
          }
          
      } else if (node.type === 'payment') {
          this.stopAudio();
          // Just waiting for user interaction in the Bottom Sheet
          console.log('Waiting for payment...');
          
      } else {
        console.warn('Unknown node type or empty text:', node.type);
        this.stopAudio();
        this.nextStep();
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
      
      // 3. Classify
      const currentNode = this.currentNode();
      if (!currentNode || !currentNode.data?.intents) {
          this.nextStep();
          return;
      }

      this.isLoading.set(true);
      this.knowledgeService.classify(text, currentNode.data.intents).then(result => {
          this.isLoading.set(false);
          console.log('Classification Result:', result);
          
          // Find matching intent branch
          const matchedIntent = currentNode.data!.intents!.find(i => i.intentName === result.intentName);
          
          if (matchedIntent && matchedIntent.nextSteps && matchedIntent.nextSteps.length > 0) {
              this.currentNode.set(matchedIntent.nextSteps[0]);
          } else {
              // Fallback: Continue main flow or show "Didn't understand"
              // For now, continue main flow logic (next sibling)
              console.log('No specific branch or Fallback');
              this.nextStep();
          }
      }).catch(err => {
          console.error('Classification failed', err);
          this.isLoading.set(false);
          this.nextStep();
      });
  }

  // Updated Finder Logic - supports returning to parent flow
  findNextNode(list: WorkflowNode[], currentId: string, parentNext?: WorkflowNode): { found: boolean, next?: WorkflowNode } {
      for (let i = 0; i < list.length; i++) {
          if (list[i].id === currentId) {
              // If there is a next sibling, go there.
              if (list[i + 1]) {
                  return { found: true, next: list[i + 1] };
              }
              // If no next sibling, but we have a parent continuation, go there.
              if (parentNext) {
                  return { found: true, next: parentNext };
              }
              // Otherwise, end of flow.
              return { found: true, next: undefined };
          }
          
          // Check children (Chips)
          if (list[i].data?.chips) {
              for (const chip of list[i].data!.chips!) {
                  if (chip.nextSteps) {
                      // Pass current node's next sibling (or parentNext) as the continuation for this branch
                      const continuation = list[i + 1] || parentNext;
                      const result = this.findNextNode(chip.nextSteps, currentId, continuation);
                      if (result.found) return result;
                  }
              }
          }
          
          // Check children (Intents)
          if (list[i].data?.intents) {
              for (const intent of list[i].data!.intents!) {
                  if (intent.nextSteps) {
                       // Pass current node's next sibling (or parentNext) as the continuation for this branch
                      const continuation = list[i + 1] || parentNext;
                      const result = this.findNextNode(intent.nextSteps, currentId, continuation);
                      if (result.found) return result;
                  }
              }
          }

          // Check children (Condition)
           if (list[i].type === 'condition') {
              const continuation = list[i + 1] || parentNext;
              
              if (list[i].data?.trueBranch) {
                   const result = this.findNextNode(list[i].data!.trueBranch!, currentId, continuation);
                   if (result.found) return result;
              }
              if (list[i].data?.falseBranch) {
                   const result = this.findNextNode(list[i].data!.falseBranch!, currentId, continuation);
                   if (result.found) return result;
              }
          }
      }
      return { found: false };
  }

  ngOnInit() {
    // 0. Fetch Knowledge Data
    // TODO: Get real tenantId from auth or route
    this.knowledgeService.fetchOrganizationInfo('demo-tenant').then(info => {
        if (info) {
            console.log('Knowledge Info Loaded:', info);
            // Map Services
            if (info.services) {
                this.services.set(info.services.map((s: any, i: number) => ({
                    id: i.toString(),
                    name: s.name,
                    price: s.price || 'Consultar',
                    duration: 'Consultar' 
                })));
            }
            
            // Map Team
            if (info.team) {
                 this.professionals.set(info.team.map((t: any, i: number) => ({
                    id: i.toString(),
                    name: t.name || t, // Handle string or object match
                    role: t.role || 'Especialista',
                    image: t.image || `https://ui-avatars.com/api/?name=${t.name || t}&background=random`
                })));
            }
        }
    }).catch(err => console.error('Failed to load org info', err));

    // 1. Load Nodes from Service (Memory)
    this.nodes = this.workflowService.getPreviewNodes();

    if (!this.nodes || this.nodes.length === 0) {
      // Redirect back if no nodes (e.g. reload on this page)
      // For dev, maybe we mock?
    //   this.goBack();
      console.warn('No nodes found in preview state');
    }

    // 2. Prefetch Audio (Latency opt)
    this.prefetchAudio();

    // 3. Start Flow
    this.startFlow();
  }

  prefetchAudio() {
    this.nodes.forEach(node => {
        if (node.type === 'voicenote' && node.data?.text) {
            const voiceId = node.data.voiceId || 'Lucia';
            this.voiceService.preload(node.data.text, voiceId);
        }
    });
  }

  startFlow() {
    // Find Root node or first node
    // Simple logic: First node in array? Or one without parent?
    // Builder adds to array order usually.
    if (this.nodes.length > 0) {
        this.currentNode.set(this.nodes[0]); 
    }
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
    const current = this.currentNode();
    if (!current) return;

    // Logic to find next node
    // 1. Where is current node?
    // This is hard with just `nodes` flat array if nested structures exist inside `data`.
    // Actually our `nodes` logic in builder is:
    // Root = [Node, Node, UserResponse]
    // UserResponse.data.chips[0].nextSteps = [Node, Node]
    
    // So we need a recursive finder to know "Where am I and what is next?"
    const { next } = this.findNextNode(this.nodes, current.id);
    
    if (next) {
        this.currentNode.set(next);
    } else {
        console.log('End of flow');
        this.finishFlow();
    }
  }

  handleOptionClick(chip: any, index: number) {
      // 1. Remove the "System Chips" message from transcript so it's not clickable anymore
      this.transcript.update(log => log.filter(msg => msg.component !== 'chips'));

      // 2. Add user selection as a normal message
      this.addTranscript('user', chip.text);
      
      // Next steps are in chip.nextSteps
      if (chip.nextSteps && chip.nextSteps.length > 0) {
          this.currentNode.set(chip.nextSteps[0]);
      } else {
          // If no specific branch steps, continue with the main flow (parent's next sibling)
          // Since currentNode is still the 'UserResponse' node, nextStep() will find its successor.
          this.nextStep();
      }
  }
  


  // Actions
  selectTime(time: string) {
      alert(`Hora seleccionada: ${time}. Aquí terminaría el flujo o iría a confirmación.`);
      this.nextStep();
  }

  restart() {
      this.stopAudio();
      this.nodes = this.workflowService.getPreviewNodes();
      this.transcript.set([]);
      this.startFlow();
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
      this.nextStep();
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
    
    // 3. Advance Step (JUST ONCE)
    this.nextStep();
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
          this.nextStep();
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

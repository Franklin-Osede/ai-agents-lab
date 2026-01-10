import { Component, OnInit, signal, inject, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkflowService } from '../../../core/services/workflow.service';
import { VoiceService } from '../../../core/services/voice.service';
import { WorkflowNode } from '../workflow-builder/workflow-builder.component'; // Import type
import { KnowledgeService } from '../../../knowledge/services/knowledge.service';

@Component({
  selector: 'app-workflow-runner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workflow-runner.component.html',
  styleUrls: ['./workflow-runner.component.scss']
})
export class WorkflowRunnerComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private workflowService = inject(WorkflowService);
  private voiceService = inject(VoiceService);
  private knowledgeService = inject(KnowledgeService);

  // State
  nodes: WorkflowNode[] = [];
  currentNode = signal<WorkflowNode | null>(null);
  
  // UI State
  isPlayingAudio = signal(false);
  isLoading = signal(false);
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
        this.addTranscript('agent', node.data.text);
        const voiceId = node.data.voiceId || (node.data.voiceGender === 'male' ? 'Sergio' : 'Lucia');
        this.playAudio(node.data.text, voiceId);
        
      } else if (node.type === 'message' && node.data?.text) {
         this.addTranscript('agent', node.data.text);
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
          
      // --- BOTTOM SHEET INTERACTIVE NODES (Widgets) ---
          
      } else if (node.type === 'calendar' || node.type === 'form' || node.type === 'professional' || node.type === 'services') {
          // Just show widget.
          this.stopAudio();
          
      } else if (node.type === 'ragsearch') {
          this.stopAudio();
          this.isSearching.set(true);
          setTimeout(() => {
              this.isSearching.set(false);
              this.addTranscript('agent', "He encontrado disponibilidad para esa fecha.");
              this.nextStep();
          }, 2000);
          
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

  addTranscript(sender: 'agent'|'user', text: string) {
      this.transcript.update(log => [...log, { sender, text }]);
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
      // User selected an option.
      this.addTranscript('user', chip.text);
      
      // Next steps are in chip.nextSteps
      if (chip.nextSteps && chip.nextSteps.length > 0) {
          this.currentNode.set(chip.nextSteps[0]);
      } else {
          // If no nested steps, does it go back to main flow?
          // Or end?
          // For linear simplicity, usually ends or goes to parent's next sibling?
          // Our builder UI supports nested branches. So likely it continues INSIDE that branch.
          // If empty, ends.
          console.log('Branch ended');
      }
  }
  
  // Helper to find current node position and next sibling
  findNextNode(list: WorkflowNode[], currentId: string): { found: boolean, next?: WorkflowNode } {
      for (let i = 0; i < list.length; i++) {
          if (list[i].id === currentId) {
              return { found: true, next: list[i + 1] };
          }
          
          // Check children
          if (list[i].data?.chips) {
              for (const chip of list[i].data!.chips!) {
                  if (chip.nextSteps) {
                      const result = this.findNextNode(chip.nextSteps, currentId);
                      if (result.found) return result;
                  }
              }
          }
      }
      return { found: false };
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
      this.router.navigate(['../'], { relativeTo: this.route });
  }

  finishFlow() {
      // Show restart or exit
      this.addTranscript('agent', "¡Gracias! Flujo completado.");
  }
}

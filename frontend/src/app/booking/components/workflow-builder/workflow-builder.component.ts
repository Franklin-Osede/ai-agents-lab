import { Component, OnInit, signal, effect, inject, ViewChild, ElementRef, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowService } from '../../../core/services/workflow.service';
import { VoiceService, Voice } from '../../../core/services/voice.service';
import { Subject, combineLatest } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { IntentRegistryService, IntentPreset } from '../../../core/services/intent-registry.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { A11yModule } from '@angular/cdk/a11y';

// --- Types ---

export interface WorkflowNode {
  id: string;
  type: 'voicenote' | 'userresponse' | 'message' | 'form' | 'condition' | 'bodymap' | 'services' | 'calendar' | 'ragsearch' | 'confirm' | 'professional' | 'smartlisten' | 'payment';
  label: string;
  position: { x: number; y: number };
  data?: {
    text?: string;
    voiceGender?: 'male' | 'female';
    voiceId?: string; // New ID-based system
    emoji?: string;
    chips?: { 
        text: string; 
        emoji?: string; 
        nextSteps?: WorkflowNode[]; 
        isCollapsed?: boolean;
    }[];
    fields?: { label: string; type: 'text' | 'email' | 'phone' | 'number'; required: boolean }[];
    variable?: string;
    operator?: '==' | '!=' | '>' | '<' | 'contains';
    value?: string;
    bodyView?: 'front' | 'back';
    searchQuery?: string;
    confirmText?: string;
    // Conditional Data
    trueBranch?: WorkflowNode[];
    falseBranch?: WorkflowNode[];
    // Payment Data
    amount?: number;
    currency?: string;
    concept?: string;
    // Smart Listen Data
    intents?: {  
        intentName: string; 
        keywords?: string[]; 
        nextSteps?: WorkflowNode[]; 
        isCollapsed?: boolean;
    }[];
    successMessage?: string; // Add this field
  };
}

export interface WorkflowSettings {
  voiceGender: 'male' | 'female';
  voiceName: string;
  agentName: string;
  tone: 'professional' | 'friendly' | 'medical';
  language: 'es' | 'en' | 'ca';
  primaryColor: string;
}

export interface InsertContext {
  parentNodeId?: string; // If null, root level
  optionIndex?: number;  // If defined, inside this option (or true/false branch) of parent
  branchType?: 'true' | 'false'; // For conditional nodes
  index: number;         // Index within the list (root or nested)
}



@Component({
  selector: 'app-workflow-builder',
  standalone: true, // It is creating as standalone
  imports: [
    CommonModule, 
    DragDropModule, 
    FormsModule, 
    MatChipsModule, 
    MatIconModule,
    MatFormFieldModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    A11yModule
  ],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./workflow-builder.component.scss']
})
export class WorkflowBuilderComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private workflowService = inject(WorkflowService);
  private voiceService = inject(VoiceService);
  private intentRegistry = inject(IntentRegistryService); // Inject Service
  
  // Available voices for the UI
  availableVoices: Voice[] = [];

  // --- State Signals ---
  niche = signal('');
  // Computed for presets
  availableIntents = computed(() => this.intentRegistry.getPresets(this.niche()));

  nodes = signal<WorkflowNode[]>([]);
  workflowId = signal<string | null>(null);
  lastSaved = signal<Date | null>(null);
  isSaving = signal(false);
  isPublishing = signal(false);
  // ... (rest of the code)


  selectedNodeId = signal<string | null>(null);
  
  // Menu State
  isInsertMenuOpen = signal(false);
  
  // We need to track WHERE we are inserting.
  // Default to root end if not specified.
  currentInsertContext = signal<InsertContext>({ index: 0 });

  // Template Menu State
  isTemplateMenuOpen = signal(false);
  
  // Computed available templates based on Niche
  // Computed available templates based on Niche
  availableTemplates = computed(() => {
     const n = this.niche()?.toLowerCase() || '';
     const allTemplates = [
        // Added 'health' to medical template as it seems to be the default for the user
        { id: 'medical-template', label: 'Médico General', icon: 'stethoscope', niches: ['medical', 'doctor', 'physio', 'psychology', 'demo', 'health'] },
        { id: 'dental-template', label: 'Clínica Dental', icon: 'dentistry', niches: ['dental', 'dentist'] },
     ];
     
     // STRICT FILTERING as requested ("solo me deberia mostrar la plantilla de la seccion")
     return allTemplates.filter(t => t.niches.some(target => n.includes(target)));
  });

  // Settings
  settings = signal<WorkflowSettings>({
    voiceGender: 'female',
    voiceName: 'Lucia',
    agentName: 'Asistente Virtual',
    tone: 'professional',
    language: 'es',
    primaryColor: '#6c2bee'
  });

  // Palette
  nodeTypes = [
    { type: 'voicenote', icon: 'mic', label: 'Nota de\nVoz', emoji: '🎤', color: 'blue' },
    { type: 'userresponse', icon: 'chat', label: 'Respuesta\nUsuario', emoji: '💬', color: 'purple' },
    { type: 'message', icon: 'message', label: 'Mensaje\nSimple', emoji: '💬', color: 'cyan' },
    { type: 'form', icon: 'edit_note', label: 'Formulario', emoji: '📋', color: 'teal' },
    { type: 'condition', icon: 'alt_route', label: 'Condición', emoji: '🔀', color: 'amber' },
    { type: 'bodymap', icon: 'accessibility', label: 'Mapa\nCorporal', emoji: '🗺️', color: 'indigo' },
    { type: 'services', icon: 'medical_services', label: 'Mostrar\nServicios', emoji: '💼', color: 'green' },
    { type: 'professional', icon: 'person', label: 'Elegir\nProfesional', emoji: '👨‍⚕️', color: 'cyan' },
    { type: 'calendar', icon: 'calendar_month', label: 'Calendario', emoji: '📅', color: 'orange' },
    { type: 'ragsearch', icon: 'search', label: 'Búsqueda\nRAG', emoji: '🔍', color: 'pink' },
    { type: 'smartlisten', icon: 'hearing', label: 'Escucha\nInteligente', emoji: '🧠', color: 'red' },
    { type: 'payment', icon: 'credit_card', label: 'Pasarela\nPago', emoji: '💳', color: 'slate' },
    { type: 'confirm', icon: 'check_circle', label: 'Confirmar', emoji: '✅', color: 'emerald' }
  ];

  // History
  history: WorkflowNode[][] = [];
  historyIndex = -1;
  clipboard: WorkflowNode[] = [];
  
  // Validation
  validationErrors = signal<Record<string, string[]>>({});
  
  private saveSubject = new Subject<void>();

  constructor() {
      // Auto-save effect
      effect(() => {
        this.nodes();
        this.settings();
        this.runValidation();
        this.saveSubject.next();
      }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.availableVoices = this.voiceService.getAvailableVoices();

    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).subscribe(([params, queryParams]) => {
      this.niche.set(params['niche']);
      
      const workflowIdFromQuery = queryParams['workflowId'];
      
      if (workflowIdFromQuery) {
          console.log('Loading specific workflow ID:', workflowIdFromQuery);
          // Only load if it's a new ID or we haven't loaded yet
          if (this.workflowId() !== workflowIdFromQuery) {
             this.loadWorkflowById(workflowIdFromQuery);
          }
      } else {
          // If no ID in query, fallback to standard load (cache or niche-latest)
          // But be careful not to overwrite if we already have nodes and just lost the ID param?
          // For now, standard load is safe as it checks cache first.
          this.loadWorkflow();
      }
    });

    this.saveSubject.pipe(
      debounceTime(2000), 
      filter(() => !!this.workflowId() && !!this.niche())
    ).subscribe(() => {
      this.saveWorkflow();
    });
  }

  // --- CRUD Operations ---

  openInsertMenu(context: InsertContext) {
    this.currentInsertContext.set(context);
    this.isInsertMenuOpen.set(true);
  }

  closeInsertMenu() {
    this.isInsertMenuOpen.set(false);
  }

  drop(event: CdkDragDrop<WorkflowNode[]>) {
    // Check if dropping in the same container (reordering)
    if (event.previousContainer === event.container) {
       // We can mutate the array in place because `event.container.data` is a reference to the array inside our tree
       moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
       
       // Trigger change detection by updating root signal with a shallow copy
       // This forces Angular to check the signals again
       this.nodes.update(n => [...n]);
       
       this.addToHistory(); // Save state after reorder
    }
  }

  addNodeAtIndex(type: string) {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      label: this.getNodeLabel(type),
      position: { x: 0, y: 0 }, 
      data: this.getDefaultNodeData(type)
    };

    this.addToHistory();

    const ctx = this.currentInsertContext();
    
    // Update immutable tree
    const updatedNodes = this.insertNodeRecursive(this.nodes(), newNode, ctx);
    this.nodes.set(updatedNodes);

    this.selectedNodeId.set(newNode.id);
    this.closeInsertMenu();
  }

  // Recursive Helper: Insert
  insertNodeRecursive(currentNodes: WorkflowNode[], newNode: WorkflowNode, ctx: InsertContext): WorkflowNode[] {
      // Base Case: Root Level Insertion (if no parent specified)
      if (!ctx.parentNodeId) {
          const newMsg = [...currentNodes];
          newMsg.splice(ctx.index, 0, newNode);
          return newMsg;
      }

      // Recursive Case: Find parent and insert into specific option
      return currentNodes.map(node => {
          if (node.id === ctx.parentNodeId) {
              // Found the parent!
              // Handle User Response (Chips)
              if (node.type === 'userresponse' && node.data?.chips && ctx.optionIndex !== undefined) {
                   const newChips = [...node.data.chips];
                   const specificOption = { ...newChips[ctx.optionIndex] };
                   const currentOptionSteps = specificOption.nextSteps ? [...specificOption.nextSteps] : [];
                   
                   // Insert into the nested array
                   currentOptionSteps.splice(ctx.index, 0, newNode);
                   
                   specificOption.nextSteps = currentOptionSteps;
                   newChips[ctx.optionIndex] = specificOption;
                   
                   return { ...node, data: { ...node.data, chips: newChips } };
              }
              // Handle Smart Listen (Intents)
              if (node.type === 'smartlisten' && node.data?.intents && ctx.optionIndex !== undefined) {
                   const newIntents = [...node.data.intents];
                   const specificIntent = { ...newIntents[ctx.optionIndex] };
                   const currentIntentSteps = specificIntent.nextSteps ? [...specificIntent.nextSteps] : [];
                   
                   currentIntentSteps.splice(ctx.index, 0, newNode);
                   
                   specificIntent.nextSteps = currentIntentSteps;
                   newIntents[ctx.optionIndex] = specificIntent;
                   
                   return { ...node, data: { ...node.data, intents: newIntents } };
              }
              // Handle Conditional (True/False Branches)
              if (node.type === 'condition' && ctx.branchType) {
                   const branchKey = ctx.branchType === 'true' ? 'trueBranch' : 'falseBranch';
                   const currentBranch = node.data?.[branchKey] ? [...node.data[branchKey]!] : [];
                   
                   currentBranch.splice(ctx.index, 0, newNode);
                   
                   return { ...node, data: { ...node.data, [branchKey]: currentBranch } };
              }
              return node;
          }
          
          // Drill down if this node has children
          if (node.data?.chips) {
              const newChips = node.data.chips.map(chip => {
                  if (chip.nextSteps && chip.nextSteps.length > 0) {
                       return {
                           ...chip,
                           nextSteps: this.insertNodeRecursive(chip.nextSteps, newNode, ctx)
                       };
                  }
                  return chip;
              });
              return { ...node, data: { ...node.data, chips: newChips } };
          }
          
          // Drill down (Intents)
          if (node.data?.intents) {
              const newIntents = node.data.intents.map(intent => {
                   if (intent.nextSteps && intent.nextSteps.length > 0) {
                       return {
                           ...intent,
                           nextSteps: this.insertNodeRecursive(intent.nextSteps, newNode, ctx)
                       };
                   }
                   return intent;
              });
               return { ...node, data: { ...node.data, intents: newIntents } };
          }
          
          // Drill down (Condition Branches)
          if (node.type === 'condition') {
               const trueBranch = node.data?.trueBranch ? this.insertNodeRecursive(node.data.trueBranch, newNode, ctx) : [];
               const falseBranch = node.data?.falseBranch ? this.insertNodeRecursive(node.data.falseBranch, newNode, ctx) : [];
               
               return { ...node, data: { ...node.data, trueBranch, falseBranch } };
          }
          
          return node;
      });
  }

  deleteNode(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este paso?')) return;
    this.addToHistory();
    const updated = this.deleteNodeRecursive(this.nodes(), id);
    this.nodes.set(updated);
    
    if (this.selectedNodeId() === id) {
        this.selectedNodeId.set(null);
    }
  }

  deleteNodeRecursive(nodes: WorkflowNode[], idToDelete: string): WorkflowNode[] {
      // Filter out the node at this level
      const filtered = nodes.filter(n => n.id !== idToDelete);
      
      // Recurse into children
      return filtered.map(node => {
          
          // Recurse Chips
          if (node.data?.chips) {
              const newChips = node.data.chips.map(chip => ({
                  ...chip,
                  nextSteps: chip.nextSteps ? this.deleteNodeRecursive(chip.nextSteps, idToDelete) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
          }
          // Recurse Intents
          if (node.data?.intents) {
              const newIntents = node.data.intents.map(intent => ({
                  ...intent,
                  nextSteps: intent.nextSteps ? this.deleteNodeRecursive(intent.nextSteps, idToDelete) : []
              }));
              return { ...node, data: { ...node.data, intents: newIntents } };
          }

          // Recurse Condition Branches
          if (node.type === 'condition') {
               const trueBranch = node.data?.trueBranch ? this.deleteNodeRecursive(node.data.trueBranch, idToDelete) : [];
               const falseBranch = node.data?.falseBranch ? this.deleteNodeRecursive(node.data.falseBranch, idToDelete) : [];
               return { ...node, data: { ...node.data, trueBranch, falseBranch } };
          }
          
          return node;
      });
  }
  
  selectNode(id: string) {
    this.selectedNodeId.set(id);
  }

  updateNodeData(id: string, partialData: any) {
    const updated = this.updateNodeRecursive(this.nodes(), id, partialData);
    this.nodes.set(updated);
    // Auto-save triggers automatically via effect
  }

  updateNodeRecursive(nodes: WorkflowNode[], id: string, partialData: any): WorkflowNode[] {
      return nodes.map(node => {
          if (node.id === id) {
              return { ...node, data: { ...node.data, ...partialData } };
          }
          
          
          // Recurse Chips
          if (node.data?.chips) {
              const newChips = node.data.chips.map(chip => ({
                  ...chip,
                  nextSteps: chip.nextSteps ? this.updateNodeRecursive(chip.nextSteps, id, partialData) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
          }
          // Recurse Intents
          if (node.data?.intents) {
              const newIntents = node.data.intents.map(intent => ({
                  ...intent,
                  nextSteps: intent.nextSteps ? this.updateNodeRecursive(intent.nextSteps, id, partialData) : []
              }));
              return { ...node, data: { ...node.data, intents: newIntents } };
          }

          // Recurse Condition Branches
          if (node.type === 'condition') {
               const trueBranch = node.data?.trueBranch ? this.updateNodeRecursive(node.data.trueBranch, id, partialData) : [];
               const falseBranch = node.data?.falseBranch ? this.updateNodeRecursive(node.data.falseBranch, id, partialData) : [];
               return { ...node, data: { ...node.data, trueBranch, falseBranch } };
          }
          
          return node;
      });
  }

  // --- Specific Logic (Chips, Forms) ---

  // NOTE: When updating a chip text, we are just updating the node data.
  // The 'updateNodeData' helper handles recursion, so we just construct the payload.
  // But updating a SPECIFIC chip inside an array is tricky with generic 'updateNodeData'.
  // Let's make a specific recursive updater for chips.
  
  updateChip(nodeId: string, chipIndex: number, text: string) {
      this.nodes.update(curr => this.updateChipRecursive(curr, nodeId, chipIndex, text));
  }

  updateChipRecursive(nodes: WorkflowNode[], nodeId: string, chipIndex: number, text: string): WorkflowNode[] {
      return nodes.map(node => {
          if (node.id === nodeId) {
              // Handle Intents
              if (node.data?.intents) {
                  const intents = [...node.data.intents];
                  if (intents[chipIndex]) {
                      intents[chipIndex] = { ...intents[chipIndex], intentName: text };
                  }
                  return { ...node, data: { ...node.data, intents } };
              }
              // Handle Chips
              const chips = [...(node.data?.chips || [])];
              if (chips[chipIndex]) {
                  chips[chipIndex] = { ...chips[chipIndex], text };
              }
              return { ...node, data: { ...node.data, chips } };
          }
          
          // Recurse children (Chips)
          if (node.data?.chips) {
              const newChips = node.data.chips.map(c => ({
                  ...c,
                  nextSteps: c.nextSteps ? this.updateChipRecursive(c.nextSteps, nodeId, chipIndex, text) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
          }
          // Recurse children (Intents)
          if (node.data?.intents) {
              const newIntents = node.data.intents.map(i => ({
                  ...i,
                  nextSteps: i.nextSteps ? this.updateChipRecursive(i.nextSteps, nodeId, chipIndex, text) : []
              }));
              return { ...node, data: { ...node.data, intents: newIntents } };
          }
          return node;
      });
  }

  addChipToNode(nodeId: string, text?: string) {
    this.nodes.update(curr => this.addChipRecursive(curr, nodeId, text));
  }

  addChipRecursive(nodes: WorkflowNode[], nodeId: string, text = 'Nueva Opción'): WorkflowNode[] {
     return nodes.map(node => {
        if (node.id === nodeId) {
            // Handle Intents
            if (node.data?.intents) {
                const intents = [...node.data.intents, { intentName: text, nextSteps: [] }];
                return { ...node, data: { ...node.data, intents } };
            }
            // Handle Chips
            const chips = [...(node.data?.chips || []), { text: text, nextSteps: [] }];
            return { ...node, data: { ...node.data, chips } };
        }
        
        // Recurse children (Chips)
        if (node.data?.chips) {
            const newChips = node.data.chips.map(c => ({
                ...c,
                nextSteps: c.nextSteps ? this.addChipRecursive(c.nextSteps, nodeId, text) : []
            }));
            return { ...node, data: { ...node.data, chips: newChips } };
        }
        // Recurse children (Intents)
        if (node.data?.intents) {
            const newIntents = node.data.intents.map(i => ({
                ...i,
                nextSteps: i.nextSteps ? this.addChipRecursive(i.nextSteps, nodeId, text) : []
            }));
            return { ...node, data: { ...node.data, intents: newIntents } };
        }
        return node;
    });
  }

  removeChipFromNode(nodeId: string, index: number) {
      this.nodes.update(curr => this.removeChipRecursive(curr, nodeId, index));
  }
  
  removeChipRecursive(nodes: WorkflowNode[], nodeId: string, index: number): WorkflowNode[] {
      return nodes.map(node => {
          if (node.id === nodeId) {
              // Handle Intents
              if (node.data?.intents) {
                  const intents = [...node.data.intents];
                  intents.splice(index, 1);
                  return { ...node, data: { ...node.data, intents } };
              }
              // Handle Chips
              const chips = [...(node.data?.chips || [])];
              chips.splice(index, 1); 
              return { ...node, data: { ...node.data, chips } };
          }
          
          // Recurse Chips
          if (node.data?.chips) {
              const newChips = node.data.chips.map(c => ({
                  ...c,
                  nextSteps: c.nextSteps ? this.removeChipRecursive(c.nextSteps, nodeId, index) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
          }
          // Recurse Intents
          if (node.data?.intents) {
              const newIntents = node.data.intents.map(i => ({
                  ...i,
                  nextSteps: i.nextSteps ? this.removeChipRecursive(i.nextSteps, nodeId, index) : []
              }));
              return { ...node, data: { ...node.data, intents: newIntents } };
          }
          return node;
      });
  }

  toggleChipCollapse(nodeId: string, index: number) {
      this.nodes.update(curr => this.toggleChipCollapseRecursive(curr, nodeId, index));
  }

  toggleChipCollapseRecursive(nodes: WorkflowNode[], nodeId: string, index: number): WorkflowNode[] {
      return nodes.map(node => {
          if (node.id === nodeId) {
              // Handle Intents
              if (node.data?.intents) {
                  const intents = [...node.data.intents];
                  if (intents[index]) {
                      intents[index] = { ...intents[index], isCollapsed: !intents[index].isCollapsed };
                  }
                  return { ...node, data: { ...node.data, intents } };
              }
              // Handle Chips
              const chips = [...(node.data?.chips || [])];
              if (chips[index]) {
                  chips[index] = { ...chips[index], isCollapsed: !chips[index].isCollapsed };
              }
              return { ...node, data: { ...node.data, chips } };
          }
          
          // Recurse Chips
          if (node.data?.chips) {
               const newChips = node.data.chips.map(c => ({
                  ...c,
                  nextSteps: c.nextSteps ? this.toggleChipCollapseRecursive(c.nextSteps, nodeId, index) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
          }
          // Recurse Intents
          if (node.data?.intents) {
               const newIntents = node.data.intents.map(i => ({
                  ...i,
                  nextSteps: i.nextSteps ? this.toggleChipCollapseRecursive(i.nextSteps, nodeId, index) : []
              }));
              return { ...node, data: { ...node.data, intents: newIntents } };
          }
          return node;
      });
  }
  

  // --- Intent Presets Helper ---
  addPresetToNode(nodeId: string, preset: IntentPreset) {
      this.nodes.update(curr => this.addPresetRecursive(curr, nodeId, preset));
  }

  addPresetRecursive(nodes: WorkflowNode[], nodeId: string, preset: IntentPreset): WorkflowNode[] {
      return nodes.map(node => {
          if (node.id === nodeId && node.data?.intents) {
              // Check if already exists to avoid duplicates
              const exists = node.data.intents.some(i => i.intentName === preset.name);
              if (exists) return node;

              const newIntent = {
                  intentName: preset.name,
                  keywords: preset.keywords,
                  nextSteps: []
              };
              
              const intents = [...node.data.intents, newIntent];
              return { ...node, data: { ...node.data, intents } };
          }
          
          // Recurse children
           if (node.data?.chips) {
              const newChips = node.data.chips.map(c => ({
                  ...c,
                  nextSteps: c.nextSteps ? this.addPresetRecursive(c.nextSteps, nodeId, preset) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
          }
          if (node.data?.intents) { // Fix: Recurse into intents too!
               const newIntents = node.data.intents.map(i => ({
                  ...i,
                  nextSteps: i.nextSteps ? this.addPresetRecursive(i.nextSteps, nodeId, preset) : []
              }));
              return { ...node, data: { ...node.data, intents: newIntents } };
          }
          
          return node;
      });
  }

  // --- Standard Methods (Load, Save, etc) ---

  
  loadWorkflow() {
    const niche = this.niche();
    if (!niche) return;

    // 1. Check if we have state in Memory (returning from Runner)
    const cachedNodes = this.workflowService.getPreviewNodes();
    if (cachedNodes && cachedNodes.length > 0) {
        console.log('Restoring cached workflow state:', cachedNodes);
        this.nodes.set(cachedNodes);
        // We still fetch to get the ID if missing, or just assume we rely on what we had.
        // Ideally we also cached the ID.
        if (!this.workflowId()) {
             // Try to fetch just to get metadata/ID if needed, but don't overwrite nodes?
             // Or just proceed. if we have nodes we are good for editing.
        }
        return; 
    }

    // 2. Fetch from Backend
    this.workflowService.getWorkflow(niche).subscribe({
      next: (data) => {
        if (data && data.workflow) {
          this.workflowId.set(data.workflow.id);
          if (data.version) {
            this.nodes.set(data.version.nodes || []);
            if (data.version.settings) this.settings.set(data.version.settings);
          } else {
            this.nodes.set([]);
          }
        } else {
           this.createWorkflow(niche);
        }
      },
      error: () => this.createWorkflow(niche)
    });
  }

  loadWorkflowById(id: string) {
      this.workflowService.getWorkflowById(id).subscribe({
          next: (data) => {
              if (data && data.workflow) {
                 this.workflowId.set(data.workflow.id);
                  if (data.version) {
                    this.nodes.set(data.version.nodes || []);
                    if (data.version.settings) this.settings.set(data.version.settings);
                  } else {
                    this.nodes.set([]);
                  }
              }
          },
          error: (err) => console.error('Could not load specific workflow', err)
      });
  }

  loadTemplate(templateId: string) {
      if (this.nodes().length > 0) {
          if (!confirm('¿Estás seguro? Esto reemplazará todo el flujo actual con la plantilla seleccionada.')) {
              return;
          }
      }
      
      this.isTemplateMenuOpen.set(false);
      // Show local loading state if feasible, but node clearing is enough visual cue
      this.nodes.set([]); 
      
      console.log('Loading template:', templateId, 'For niche:', this.niche());

      this.workflowService.createFromTemplate(this.niche(), templateId).subscribe({
          next: (response: any) => {
              console.log('Template loaded response:', response);
              const wfData = response.data || response;
              
              if (wfData && (wfData.id || (wfData.workflow && wfData.workflow.id))) {
                  const newId = wfData.id || wfData.workflow.id;
                  this.workflowId.set(newId);
                  
                  // If the backend returns the nodes directly (as we just added), use them!
                  if (wfData.nodes && Array.isArray(wfData.nodes) && wfData.nodes.length > 0) {
                      console.log('Using nodes returned directly from template creation:', wfData.nodes.length);
                      this.nodes.set(wfData.nodes);
                      
                      // Update URL quietly without reloading
                      this.router.navigate([], { 
                          relativeTo: this.route, 
                          queryParams: { workflowId: newId },
                          queryParamsHandling: 'merge'
                      });
                  } else {
                      // Fallback to fetch if nodes not returned
                      console.log('Nodes not in response, fetching...');
                      setTimeout(() => {
                         this.loadWorkflowById(newId);
                      }, 500);
                       // Update URL quietly
                      this.router.navigate([], { 
                          relativeTo: this.route, 
                          queryParams: { workflowId: newId },
                          queryParamsHandling: 'merge'
                      });
                  }
              } else {
                  console.error('Template response missing ID:', wfData);
                  alert('Error al cargar la plantilla: Respuesta inválida.');
              }
          },
          error: (err) => {
              console.error('Failed to load template:', err);
              alert('Error al cargar la plantilla. Inténtalo de nuevo.');
          }
      });
  }

  createWorkflow(niche: string) {
    this.workflowService.createWorkflow(niche, `Workflow ${niche}`).subscribe({
      next: (wf) => {
        this.workflowId.set(wf.id);
        this.nodes.set([]);
      }
    });
  }

  saveWorkflow() {
    const id = this.workflowId();
    if (!id) return;
    this.isSaving.set(true);
    this.workflowService.saveDraft(id, this.nodes(), this.settings()).subscribe({
      next: (v) => { this.isSaving.set(false); this.lastSaved.set(new Date()); },
      error: () => this.isSaving.set(false)
    });
  }
  
  publishWorkflow() {
      // 1. Save state to Service for Preview
      this.workflowService.setPreviewNodes(this.nodes());
      
      // 2. Also save Draft to backend
      this.saveWorkflow();
      
      // 3. Navigate to Runner
      this.router.navigate(['../run'], { relativeTo: this.route });
  }

  // --- Helpers ---
  getNodeLabel(type: string): string {
      const t = this.nodeTypes.find(x => x.type === type);
      return t ? t.label.replace('\n', ' ') : type;
  }
  
  getNodeIcon(type: string): string {
      const t = this.nodeTypes.find(x => x.type === type);
      return t ? t.icon : 'help';
  }
  
  getNodeColor(type: string): string {
      const t = this.nodeTypes.find(x => x.type === type);
      return t ? t.color : 'gray';
  }

  getDefaultNodeData(type: string): any {
    switch (type) {
      case 'voicenote': return { text: '', voiceGender: 'female', emoji: '👋' };
      case 'userresponse': return { chips: [] };
      case 'smartlisten': return { intents: [] };
      case 'bodymap': return { bodyView: 'front' };
      case 'condition': return { variable: 'body_part', operator: '==', value: '', trueBranch: [], falseBranch: [] };
      case 'payment': return { amount: 50, currency: 'EUR', concept: 'Reserva' };
      case 'form': return { fields: [{ label: 'Nombre', type: 'text', required: true }] };
      default: return {};
    }
  }

  goBack() { this.router.navigate(['/booking', this.niche(), 'preview']); }

  // --- Helper Methods for specific node types ---

  onBlurAddChip(nodeId: string, event: any) {
    const value = event.target.value;
    if (value && value.trim()) {
      this.addChipToNode(nodeId, value.trim());
      event.target.value = '';
    }
  }

  addFormField(nodeId: string) {
    this.nodes.update(nodes => {
      return this.transformNodeDataRecursive(nodes, nodeId, (data) => {
        const fields = data.fields ? [...data.fields] : [];
        fields.push({ label: 'Nuevo Campo', type: 'text', required: false });
        // Return properties to merge
        return { fields };
      });
    });
    this.addToHistory();
  }

  removeFormField(nodeId: string, index: number) {
    this.nodes.update(nodes => {
      return this.transformNodeDataRecursive(nodes, nodeId, (data) => {
        const fields = data.fields ? [...data.fields] : [];
        fields.splice(index, 1);
        return { fields };
      });
    });
    this.addToHistory();
  }

  updateFormField(nodeId: string, index: number, partialField: any) {
    this.nodes.update(nodes => {
      return this.transformNodeDataRecursive(nodes, nodeId, (data) => {
        const fields = data.fields ? [...data.fields] : [];
        if (fields[index]) {
            fields[index] = { ...fields[index], ...partialField };
        }
        return { fields };
      });
    });
     // Auto-save triggers via effect
  }

  // Generic recursive data transformer
  transformNodeDataRecursive(nodes: WorkflowNode[], id: string, transformFn: (data: any) => any): WorkflowNode[] {
    return nodes.map(node => {
        if (node.id === id) {
            const newData = transformFn(node.data || {});
            return { ...node, data: { ...node.data, ...newData } };
        }
        
        if (node.data?.chips) {
            const newChips = node.data.chips.map(chip => ({
                ...chip,
                nextSteps: chip.nextSteps ? this.transformNodeDataRecursive(chip.nextSteps, id, transformFn) : []
            }));
            return { ...node, data: { ...node.data, chips: newChips } };
        }
        return node;
    });
  }

  // --- Helper Methods for history/recursion ---
  // (Simplified for brevity, same logic as before but calling recursive methods if needed)
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvents(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Undo: Ctrl+Z / Cmd+Z
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
    }
    
    // Redo: Ctrl+Y / Cmd+Shift+Z
    if (((event.ctrlKey || event.metaKey) && event.key === 'y') || 
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')) {
      event.preventDefault();
      this.redo();
    }

    // Copy: Ctrl+C / Cmd+C
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      this.copySelection();
    }

    // Paste: Ctrl+V / Cmd+V
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      this.pasteSelection();
    }
    
    // Delete: Backspace / Delete
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const selected = this.selectedNodeId();
      if (selected) {
        this.deleteNode(selected);
      }
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.nodes.set(structuredClone(this.history[this.historyIndex]));
      const selected = this.selectedNodeId();
      if (selected && !this.nodes().find(n => n.id === selected)) { // Simple check, might need recursive check
         this.selectedNodeId.set(null);
      }
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.nodes.set(structuredClone(this.history[this.historyIndex]));
    }
  }

  copySelection() {
    const selectedId = this.selectedNodeId();
    if (!selectedId) return;
    
    // Need recursive finder for copy
    const node = this.findNodeByIdRecursive(this.nodes(), selectedId);
    if (node) {
      this.clipboard = [structuredClone(node)];
    }
  }

  pasteSelection() {
    if (this.clipboard.length === 0) return;
    this.addToHistory(); 
    
    const pastedNodes = this.clipboard.map(node => {
      const newNode = structuredClone(node);
      newNode.id = `${newNode.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      return newNode;
    });
    
    // Paste adds to root end for now (simplest)
    this.nodes.update(nodes => [...nodes, ...pastedNodes]);
    this.selectedNodeId.set(pastedNodes[0].id);
  }

  findNodeByIdRecursive(nodes: WorkflowNode[], id: string): WorkflowNode | undefined {
      for (const node of nodes) {
          if (node.id === id) return node;
          if (node.data?.chips) {
              for (const chip of node.data.chips) {
                  if (chip.nextSteps) {
                      const found = this.findNodeByIdRecursive(chip.nextSteps, id);
                      if (found) return found;
                  }
              }
          }
          // Check Intents
          if (node.data?.intents) {
              for (const intent of node.data.intents) {
                  if (intent.nextSteps) {
                      const found = this.findNodeByIdRecursive(intent.nextSteps, id);
                      if (found) return found;
                  }
              }
          }
      }
      return undefined;
  }
  
  addToHistory() {
      // Same implementations
      if (this.historyIndex < this.history.length - 1) this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(structuredClone(this.nodes()));
      this.historyIndex++;
  }

  // --- Validation ---
  runValidation() {
      const errors: Record<string, string[]> = {};
      this.validateRecursive(this.nodes(), errors);
      this.validationErrors.set(errors);
  }
  
  validateRecursive(nodes: WorkflowNode[], errors: Record<string, string[]>) {
      nodes.forEach(node => {
          const errs = [];
          if (node.type === 'voicenote' && !node.data?.text) errs.push('Texto requerido');
          if (node.type === 'userresponse' && (!node.data?.chips || node.data.chips.length === 0)) errs.push('Opciones requeridas');
          
          if (node.type === 'smartlisten' && (!node.data?.intents || node.data.intents.length === 0)) errs.push('Intenciones requeridas');

          if (errs.length > 0) errors[node.id] = errs;
          
          // Recurse Chips
          if (node.data?.chips) {
              node.data.chips.forEach(c => {
                  if (c.nextSteps) this.validateRecursive(c.nextSteps, errors);
              });
          }
          // Recurse Intents
          if (node.data?.intents) {
              node.data.intents.forEach(i => {
                  if (i.nextSteps) this.validateRecursive(i.nextSteps, errors);
              });
          }
      });
  }
  
  hasError(nodeId: string): boolean { return !!this.validationErrors()[nodeId]; }
  getErrorTooltip(nodeId: string): string { const e = this.validationErrors()[nodeId]; return e ? e.join('\n') : ''; }
}

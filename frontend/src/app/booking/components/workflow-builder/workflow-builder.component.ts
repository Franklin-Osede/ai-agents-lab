import { Component, OnInit, signal, inject, effect, HostListener, computed, TemplateRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkflowService } from '../../../core/services/workflow.service';
import { VoiceService, Voice } from '../../../core/services/voice.service';
import { Subject } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

// --- Types ---

export interface WorkflowNode {
  id: string;
  type: 'voicenote' | 'userresponse' | 'message' | 'form' | 'condition' | 'bodymap' | 'services' | 'calendar' | 'ragsearch' | 'confirm' | 'professional';
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
  optionIndex?: number;  // If defined, inside this option of parent
  index: number;         // Index within the list (root or nested)
}

@Component({
  selector: 'app-workflow-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./workflow-builder.component.scss']
})
export class WorkflowBuilderComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private workflowService = inject(WorkflowService);
  private voiceService = inject(VoiceService);
  
  // Available voices for the UI
  availableVoices: Voice[] = [];

  // --- State Signals ---
  niche = signal('');
  nodes = signal<WorkflowNode[]>([]);
  workflowId = signal<string | null>(null);
  lastSaved = signal<Date | null>(null);
  isSaving = signal(false);
  isPublishing = signal(false);

  selectedNodeId = signal<string | null>(null);
  
  // Menu State
  isInsertMenuOpen = signal(false);
  
  // We need to track WHERE we are inserting.
  // Default to root end if not specified.
  currentInsertContext = signal<InsertContext>({ index: 0 });

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

    this.route.params.subscribe(params => {
      this.niche.set(params['niche']);
      this.loadWorkflow();
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
          if (node.data?.chips) {
              const newChips = node.data.chips.map(chip => ({
                  ...chip,
                  nextSteps: chip.nextSteps ? this.deleteNodeRecursive(chip.nextSteps, idToDelete) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
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
          
          if (node.data?.chips) {
              const newChips = node.data.chips.map(chip => ({
                  ...chip,
                  nextSteps: chip.nextSteps ? this.updateNodeRecursive(chip.nextSteps, id, partialData) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
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
              const chips = [...(node.data?.chips || [])];
              if (chips[chipIndex]) {
                  chips[chipIndex] = { ...chips[chipIndex], text };
              }
              return { ...node, data: { ...node.data, chips } };
          }
          
          if (node.data?.chips) {
              const newChips = node.data.chips.map(c => ({
                  ...c,
                  nextSteps: c.nextSteps ? this.updateChipRecursive(c.nextSteps, nodeId, chipIndex, text) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
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
            const chips = [...(node.data?.chips || []), { text: text, nextSteps: [] }];
            return { ...node, data: { ...node.data, chips } };
        }
        
        if (node.data?.chips) {
            const newChips = node.data.chips.map(c => ({
                ...c,
                nextSteps: c.nextSteps ? this.addChipRecursive(c.nextSteps, nodeId, text) : []
            }));
            return { ...node, data: { ...node.data, chips: newChips } };
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
              const chips = [...(node.data?.chips || [])];
              chips.splice(index, 1); // This implicitly deletes all nested nodes in that branch!
              return { ...node, data: { ...node.data, chips } };
          }
          
          if (node.data?.chips) {
              const newChips = node.data.chips.map(c => ({
                  ...c,
                  nextSteps: c.nextSteps ? this.removeChipRecursive(c.nextSteps, nodeId, index) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
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
              const chips = [...(node.data?.chips || [])];
              if (chips[index]) {
                  chips[index] = { ...chips[index], isCollapsed: !chips[index].isCollapsed };
              }
              return { ...node, data: { ...node.data, chips } };
          }
          
          if (node.data?.chips) {
               const newChips = node.data.chips.map(c => ({
                  ...c,
                  nextSteps: c.nextSteps ? this.toggleChipCollapseRecursive(c.nextSteps, nodeId, index) : []
              }));
              return { ...node, data: { ...node.data, chips: newChips } };
          }
          return node;
      });
  }
  
  // --- Standard Methods (Load, Save, etc) ---
  
  loadWorkflow() {
    const niche = this.niche();
    if (!niche) return;

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
          
          if (errs.length > 0) errors[node.id] = errs;
          
          // Recurse
          if (node.data?.chips) {
              node.data.chips.forEach(c => {
                  if (c.nextSteps) this.validateRecursive(c.nextSteps, errors);
              });
          }
      });
  }
  
  hasError(nodeId: string): boolean { return !!this.validationErrors()[nodeId]; }
  getErrorTooltip(nodeId: string): string { const e = this.validationErrors()[nodeId]; return e ? e.join('\n') : ''; }
}

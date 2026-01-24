import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TemplateService, Template, TemplateCustomization } from '../../../core/services/template.service';

@Component({
  selector: 'app-template-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template-picker.component.html',
  styleUrls: ['./template-picker.component.scss'],
})
export class TemplatePickerComponent implements OnInit {
  private templateService = inject(TemplateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  step = signal(1); // 1: Niche, 2: Template, 3: Customize
  selectedNiche = signal<string | null>(null);
  templates = signal<Template[]>([]);
  selectedTemplate = signal<Template | null>(null);

  // Customization form
  agentName = signal('Asistente Virtual');
  greeting = signal('');
  enabledIntents = signal<Record<string, boolean>>({});

  isLoading = signal(false);
  error = signal<string | null>(null);

  // Niche options
  niches = [
    {
      id: 'health',
      icon: '🏥',
      title: 'Salud y Medicina',
      description: 'Clínicas, consultorios, fisioterapia',
    },
    {
      id: 'restaurant',
      icon: '🍽️',
      title: 'Restaurante',
      description: 'Reservas y pedidos a domicilio',
    },
    {
      id: 'services',
      icon: '💼',
      title: 'Servicios Profesionales',
      description: 'Consultoría, asesoría, servicios',
    },
  ];

  // Data from scraping
  scrapedData = signal<any>(null);
  workflowId = signal<string | null>(null);

  ngOnInit() {
    // 1. Get niche from route
    const niche = this.route.snapshot.params['niche'];
    
    // Si hay nicho, forzamos Step 2 y Loading inmediatamente para evitar pantalla gris
    if (niche) {
      this.step.set(2); 
      this.isLoading.set(true);
      this.selectedNiche.set(niche);
      // Fetch templates immediately
      this.loadTemplates(niche);
    }

    // 2. Get workflow ID
    this.route.queryParams.subscribe((params) => {
      if (params['workflowId']) {
        this.workflowId.set(params['workflowId']);
      }
    });

    // 3. Get metadata from navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (history.state as any);
    
    if (state?.metadata) {
      this.scrapedData.set(state.metadata);
      console.log('[TemplatePicker] Received scraped data:', state.metadata);
      
      // Inteligencia para el nombre:
      // Si el nombre es genérico o vacío, intentamos sacarlo de la URL o usar "Mi Agente"
      let nameToUse = state.metadata.businessName;
      const url = this.route.snapshot.queryParams['url'];

      if ((!nameToUse || nameToUse === 'Negocio Detectado') && url) {
        nameToUse = this.extractNameFromUrl(url);
      }

      this.agentName.set(nameToUse || 'Mi Agente AI');
      
      // Pre-fill greeting if available
      if (nameToUse) {
         this.greeting.set(`¡Hola! Soy el asistente virtual de ${nameToUse}, ¿en qué puedo ayudarte hoy?`);
      }
    }
  }

  // Helper para sacar nombre bonito de la URL (ej: vericatimplantologia.com -> Vericat Implantologia)
  private extractNameFromUrl(url: string): string {
    try {
      const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      const namePart = hostname.replace('www.', '').split('.')[0];
      // Capitalize first letter
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    } catch (e) {
      return '';
    }
  }

  loadTemplates(niche: string) {
    this.templateService.getTemplatesByNiche(niche).subscribe({
      next: (response) => {
        this.templates.set(response.data);
        this.isLoading.set(false);
        if (response.data.length === 0) {
          this.error.set('No hay plantillas disponibles para este nicho');
        }
      },
      error: (err) => {
        console.error('Error loading templates', err);
        this.error.set('Error al cargar plantillas. Inténtalo de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  selectNiche(niche: string) {
    this.selectedNiche.set(niche);
    this.isLoading.set(true);
    this.error.set(null);
    this.step.set(2); // Move to step 2 immediately
    this.loadTemplates(niche);
  }

  selectTemplate(template: Template) {
    this.selectedTemplate.set(template);
    
    // Initialize enabled intents (all enabled by default)
    const intents: Record<string, boolean> = {};
    if (template.defaultIntents) {
      template.defaultIntents.forEach((intent) => {
        intents[intent.name] = true;
      });
    }
    this.enabledIntents.set(intents);

    this.step.set(3);
  }

  toggleIntent(intentName: string) {
    this.enabledIntents.update((intents) => ({
      ...intents,
      [intentName]: !intents[intentName],
    }));
  }

  createWorkflow() {
    const template = this.selectedTemplate();
    if (!template) return;

    this.isLoading.set(true);
    this.error.set(null);

    const enabledIntentNames = Object.keys(this.enabledIntents()).filter(
      (key) => this.enabledIntents()[key],
    );

    const customization: TemplateCustomization = {
      agentName: this.agentName(),
      greeting: this.greeting() || undefined,
      enabledIntents: enabledIntentNames,
      customIntents: [],
    };

    this.templateService
      .createWorkflowFromTemplate(template.id, 'demo-tenant', customization)
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          // Navigate to Chat (Simulator) to test it first
          this.router.navigate(['/booking', this.selectedNiche(), 'chat'], {
            queryParams: { workflowId: response.workflow.id },
          });
        },
        error: (err) => {
          console.error('Error creating workflow', err);
          this.error.set('Error al crear el workflow. Inténtalo de nuevo.');
          this.isLoading.set(false);
        },
      });
  }

  goBack() {
    if (this.step() === 3) {
      this.step.set(2);
    } else if (this.step() === 2) {
      // If we are in step 2 (Templates), go back to Preview page
      // We pass the scraped data back to preview to avoid re-scanning
      const url = this.route.snapshot.queryParams['url'];
      if (url) {
        this.router.navigate(['/booking', this.selectedNiche(), 'preview'], {
          queryParams: { 
            url: url,
            workflowId: this.workflowId()
          },
          state: { metadata: this.scrapedData() }
        });
      } else {
        // Fallback if no URL/flow active
        this.step.set(1);
        this.templates.set([]);
      }
    } else {
      this.router.navigate(['/']);
    }
  }
}

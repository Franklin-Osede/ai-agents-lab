import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { KnowledgeService } from '../../../knowledge/services/knowledge.service';

@Component({
  selector: 'app-knowledge-preview',
  templateUrl: './knowledge-preview.component.html',
  styleUrls: ['./knowledge-preview.component.scss']
})
export class KnowledgePreviewComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private knowledgeService = inject(KnowledgeService);

  niche = signal('');
  url = signal('');
  businessName = signal<string>('Negocio'); // New signal for scraped title
  screenshot = signal<string | null>(null);

  // Data
  services: any[] = [];
  contactInfo: any = {};
  team: any[] = [];
  dynamicSections: any[] = [];
  
  // Branding
  branding = {
    primaryColor: '#3b82f6', // Default fallback
    logoUrl: '',
    tone: '' // 'Professional', 'Medical', etc.
  };

  // UI State
  isServicesExpanded = false;
  isTeamExpanded = false;
  expandedSections: Record<string, boolean> = {}; // Dynamic sections state

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.niche.set(params['niche']);
    });
    this.route.queryParams.subscribe(params => {
      this.url.set(params['url']);
    });

    // Load data from service
    const progress = this.knowledgeService.trainingProgress();
    if (progress.metadata) {
      this.mapMetadataToView(progress.metadata);
    } else {
      this.loadMockData();
    }
  }

  mapMetadataToView(metadata: any) {
    console.log('Mapping metadata:', metadata);
    
    // 1. Title
    // 4. Update Signals
    this.businessName.set(metadata.title || metadata.businessInfo?.name || 'Negocio Detectado');
    this.screenshot.set(metadata.screenshot || null);
    
    // 2. Branding (Chameleon Effect)
    if (metadata.branding) {
        this.branding.tone = metadata.branding.tone || '';
        this.branding.primaryColor = metadata.branding.primaryColor || this.branding.primaryColor;
        this.branding.logoUrl = metadata.branding.logoUrl || '';

        // Apply global style for this component view
        if (this.branding.primaryColor) {
           document.documentElement.style.setProperty('--primary-brand', this.branding.primaryColor);
        }
    }

    // 3. Dynamic Sections
    if (metadata.dynamicSections && Array.isArray(metadata.dynamicSections)) {
        this.dynamicSections = metadata.dynamicSections;
        // Initialize fold state (all collapsed by default)
        this.dynamicSections.forEach(d => {
            this.expandedSections[d.title] = false;
        });
    }

    // 4. Try to extract data (AI vs Regex Fallback)
    if (metadata.structuredData) {
      // --- AI HAPPY PATH ---
      const data = metadata.structuredData;
      
      // Services
      if (data.services && Array.isArray(data.services)) {
        this.services = data.services.map((s: any) => ({
          name: s.name,
          price: s.price || 'Consultar',
          duration: 'Consultar',
          selected: true
        }));
      }

      // Team
      if (data.team && Array.isArray(data.team)) {
        this.team = data.team.map((t: any) => ({
          name: t.name,
          role: t.role || 'Profesional'
        }));
      }

      // Business Info
      if (data.businessInfo) {
        this.contactInfo = {
          address: data.businessInfo.address || 'Dirección no detectada',
          phone: data.businessInfo.phone || 'Teléfono no detectado',
          email: data.businessInfo.email || '',
          hours: data.businessInfo.schedule || 'Horario no detectado'
        };
      } else {
         this.contactInfo = {
          address: 'Dirección no detectada',
          hours: 'Horario no detectado',
          phone: 'Teléfono no detectado'
        };
      }

    } else {
      // --- REGEX FALLBACK (LEGACY) ---
      // ... regex logic ...
      this.mapRegexFallback(metadata);
    }
  }

  mapRegexFallback(metadata: any) {
      if (metadata.summary) {
        const extractedServices = this.extractServicesFromText(metadata.summary);
        if (extractedServices.length > 0) {
          this.services = extractedServices;
        } else {
          this.services = [];
        }

       // 3. Extract Contact Info (Fallback)
       this.contactInfo = {
            address: 'Dirección no detectada',
            hours: 'Horario no detectado',
            phone: 'Teléfono no detectado',
            email: ''
        };

        const text = metadata.summary;
        
        // Extract Phone (Spanish format + international)
        const phoneMatch = text.match(/(\+34|0034)?\s?(\d{3}[\s-]?\d{2,3}[\s-]?\d{2,3})/);
        if (phoneMatch) {
            this.contactInfo.phone = phoneMatch[0].trim();
        }

        // Extract Email
        const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
        if (emailMatch) {
            this.contactInfo.email = emailMatch[0];
        }

        // Extract Address
        const addressMatch = text.match(/(C\/|Calle|Av\.|Avenida|Paseo|Plaza).{5,60}\d{5}.{0,20}/i);
        if (addressMatch) {
            this.contactInfo.address = addressMatch[0].trim();
        }

        // 4. Extract Team (Fallback)
        this.team = [];
        // Strategy: Look for lines that look like names in uppercase or following "Equipo"
        const lines = text.split('\n').map((l: string) => l.trim());
        const ignoreWords = ['FISIOTERAPIA', 'OSTEOPATIA', 'REHABILITACION', 'NOSOTROS', 'CONTACTO', 'INICIO', 'RESERVAR', 'COOKIES', 'LEGAL', 'POLITICA'];
        
        let inTeamSection = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const upper = line.toUpperCase();

            // Detect team section header
            if (upper.includes('NUESTRO EQUIPO') || upper.includes('PROFESIONALES EXPERTOS')) {
                inTeamSection = true;
                continue;
            }

            // Stop if we hit another section
            if (inTeamSection && (line.length < 3 || upper.includes('CONTACTO') || upper.includes('RESERVAR'))) {
                 // heuristic to stop reading names if section changes
            }

            // Capture names
            const isNameFormat = /^[A-ZÁÉÍÓÚÑ]+\s[A-ZÁÉÍÓÚÑ]+(\s[A-ZÁÉÍÓÚÑ]+)?$/.test(line);
            
            if ((inTeamSection || isNameFormat) && line.length > 5 && line.length < 40) {
                 const isIgnored = ignoreWords.some(w => upper.includes(w));
                 if (!isIgnored) {
                     this.team.push({ name: line, role: 'Fisioterapeuta' }); // Default role
                 }
            }
            
            if (this.team.length >= 6) break; // Limit
        }
      } else {
        this.services = [];
        this.team = [];
      }
  }

  // Toggle Helpers
  toggleServices() { this.isServicesExpanded = !this.isServicesExpanded; }
  toggleTeam() { this.isTeamExpanded = !this.isTeamExpanded; }
  toggleDynamic(title: string) {
      this.expandedSections[title] = !this.expandedSections[title];
  }

  // Slice Helpers (for Fold/Unfold)
  get visibleServices() {
      return this.isServicesExpanded ? this.services : this.services.slice(0, 4);
  }
  
  get visibleTeam() {
      return this.isTeamExpanded ? this.team : this.team.slice(0, 3);
  }

  getVisibleDynamicItems(section: any) {
      if (!section.items) return [];
      return this.expandedSections[section.title] ? section.items : section.items.slice(0, 3);
  }

  extractServicesFromText(text: string): any[] {
    const services: any[] = [];
    // 1. First strategy: Look for explicit "Service - Price" pattern
    const priceRegex = /([a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+)(?:[:-])?\s*(\d+(?:[.,]\d{1,2})?)(?:\s*€|\s*eur)/gi;
    
    let match;
    while ((match = priceRegex.exec(text)) !== null) {
        const name = match[1].trim();
        const price = match[2];
        
        if (name.length > 3 && name.length < 50) {
            services.push({
                name: name,
                price: `${price}€`,
                duration: 'Consultar', 
                selected: true
            });
        }
    }

    // 2. Fallback strategy: If few services found, look for keyword-based services (menu items)
    if (services.length < 2) {
      const commonServicesKeywords = [
        'fisioterapia', 'physiotherapy', 
        'osteopatía', 'osteopathy', 
        'rehabilitación', 'rehabilitation', 
        'entrenamiento', 'training', 
        'pilates', 'yoga', 
        'masaje', 'massage', 
        'suelo pélvico', 'pelvic floor',
        'punción seca', 'dry needling',
        'ecografía', 'ultrasound',
        'diatermia', 'diathermy'
      ];

      const lines = text.split('\n').map(l => l.trim());
      
      lines.forEach(line => {
        // Must be a reasonable length for a service name
        if (line.length < 4 || line.length > 60) return;
        
        // specific filtering to avoid common noise
        if (line.includes('Copyright') || line.includes('Policy') || line.includes('Política')) return;

        const lowerLine = line.toLowerCase();
        
        // Check if line contains a service keyword
        const isService = commonServicesKeywords.some(kw => lowerLine.includes(kw));
        
        // Avoid duplicates
        const exists = services.some(s => s.name.toLowerCase() === lowerLine);
        
        if (isService && !exists) {
           services.push({
             name: line, // Keep original casing
             price: 'Consultar',
             duration: 'Consultar',
             selected: true
           });
        }
      });
    }
    
    return services.slice(0, 10); // Return up to 10 services
  }

  loadMockData() {
    this.services = [
      { name: 'Fisioterapia Deportiva', price: '50€', duration: '50 min', selected: true },
      { name: 'Masaje Descontracturante', price: '45€', duration: '40 min', selected: true },
      { name: 'Osteopatía', price: '60€', duration: '50 min', selected: true },
      { name: 'Rehabilitación', price: 'Consultar', duration: '30 min', selected: false }
    ];

    this.contactInfo = {
      phone: '+34 600 123 456',
      email: 'contacto@clinicaejemplo.com',
      address: 'Calle Mayor 123, Madrid',
      hours: 'L-V: 09:00 - 20:00'
    };

    this.team = [
      { name: 'Dr. Alejandro García', role: 'Fisioterapeuta' },
      { name: 'Dra. María López', role: 'Osteópata' }
    ];
  }

  continueToChat() {
    // Navigate to workflow builder or direct to chat
    // For now, let's assume we go to a workflow builder or the final chat
    // Based on the flow: knowledge -> workflow -> chat
    this.router.navigate(['/booking', this.niche(), 'builder']); 
  }

  rescan() {
    this.router.navigate(['/booking', this.niche(), 'setup']);
  }
}

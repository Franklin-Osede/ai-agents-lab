import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  // Signals
  niche = signal('');
  url = signal('');
  businessName = signal('Negocio Detectado'); // New signal for scraped title
  screenshot = signal<string>('');

  // Data
  services: any[] = [];
  contactInfo: any = {};
  team: any[] = [];
  dynamicSections: any[] = [];
  socialMedia: any = {}; // Phase 1: Social media links
  
  // Branding
  branding = {
    primaryColor: '#3b82f6', // Default fallback
    logoUrl: '',
    tone: '' // 'Professional', 'Medical', etc.
  };

  // UI State
  isServicesExpanded = false;
  isContactInfoExpanded = true; // Start expanded
  isTeamExpanded = false;
  expandedSections: Record<string, boolean> = {}; // Dynamic sections state
  
  // Add Service State
  addingNewService = false;
  newServiceName = '';

  // Helper for template
  hasKeys(obj: any): boolean {
    return obj && Object.keys(obj).length > 0;
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.niche.set(params['niche']);
    });
    this.route.queryParams.subscribe(params => {
      this.url.set(params['url']);
    });

    // Try to get metadata from router state first (passed from TrainingOverlay)
    const navigation = this.router.getCurrentNavigation();
    const stateMetadata = navigation?.extras?.state?.['metadata'] || history.state?.metadata;
    
    if (stateMetadata) {
      console.log('Loading metadata from router state:', stateMetadata);
      this.mapMetadataToView(stateMetadata);
    } else {
      // Fallback: Load from service
      const progress = this.knowledgeService.trainingProgress();
      if (progress.metadata) {
        console.log('Loading metadata from service:', progress.metadata);
        this.mapMetadataToView(progress.metadata);
      } else {
        console.warn('No metadata found, loading mock data');
        this.loadMockData();
      }
    }
  }

  mapMetadataToView(metadata: any) {
    console.log('Mapping metadata:', metadata);
    console.log('branding:', metadata.branding);
    console.log('structuredData:', metadata.structuredData);
    
    // Set screenshot
    if (metadata.screenshot) {
      this.screenshot.set(metadata.screenshot);
    }

    // 1. BUSINESS NAME (from branding or title)
    const businessName = metadata.branding?.businessName || metadata.title || 'Negocio Detectado';
    this.businessName.set(businessName);
    
    this.screenshot.set(metadata.screenshot || null);
    
    // 3. BRANDING - Apply logo and colors
    if (metadata.branding) {
      const branding = metadata.branding;
      
      // Logo
      if (branding.logoUrl) {
        this.branding.logoUrl = branding.logoUrl;
        console.log('✅ Logo found:', branding.logoUrl);
      }
      
      // Primary Color - Apply to UI
      if (branding.primaryColor) {
        this.branding.primaryColor = branding.primaryColor;
        // Apply CSS variable for dynamic theming
        document.documentElement.style.setProperty('--primary-brand', branding.primaryColor);
        console.log('✅ Brand color applied:', branding.primaryColor);
      }
      
      // Business Info
      if (branding.address || branding.phone || branding.email || branding.hours) {
        this.contactInfo = {
          address: branding.address || 'Dirección no detectada',
          phone: branding.phone || 'Teléfono no detectado',
          email: branding.email || '',
          hours: branding.hours || 'Horario no detectado'
        };
        console.log('✅ Business info loaded:', this.contactInfo);
      }
      
      // Social Media
      if (branding.socialMedia && Object.keys(branding.socialMedia).length > 0) {
        this.socialMedia = branding.socialMedia;
        console.log('✅ Social media found:', this.socialMedia);
      }
      
      // NAVBAR SERVICES (Priority: extracted from navbar)
      if (branding.services && Array.isArray(branding.services) && branding.services.length > 0) {
        console.log('✅ Navbar services found:', branding.services);
        this.services = branding.services.map((serviceName: string) => ({
          name: serviceName,
          price: 'Consultar',
          duration: 'Consultar',
          selected: true
        }));
      }
    }

    // 4. STRUCTURED DATA (Services, Team)
    if (metadata.structuredData) {
      console.log('✅ structuredData exists, parsing...');
      const data = metadata.structuredData;
      console.log('Parsed data JSON:', JSON.stringify(data, null, 2));
      
      // Services - Merge with navbar services if we already have them
      if (data.services && Array.isArray(data.services) && data.services.length > 0) {
        console.log('✅ AI Services found:', data.services);
        
        // If we already have navbar services, merge them (avoiding duplicates)
        if (this.services.length > 0) {
          const existingNames = this.services.map(s => s.name.toLowerCase());
          const aiServices = data.services
            .filter((s: any) => !existingNames.includes(s.name.toLowerCase()))
            .map((s: any) => ({
              name: s.name,
              price: s.price || 'Consultar',
              duration: 'Consultar',
              selected: true
            }));
          this.services = [...this.services, ...aiServices];
          console.log('✅ Merged navbar + AI services:', this.services);
        } else {
          // No navbar services, use AI services only
          this.services = data.services.map((s: any) => ({
            name: s.name,
            price: s.price || 'Consultar',
            duration: 'Consultar',
            selected: true
          }));
        }
      } else if (this.services.length === 0) {
        console.warn('❌ No services in structuredData and no navbar services');
      }

      // Team
      if (data.team && Array.isArray(data.team) && data.team.length > 0) {
        this.team = data.team.map((t: any) => ({
          name: t.name,
          role: t.role || 'Profesional'
        }));
        console.log('✅ Team found:', this.team);
      }
    } else {
      console.warn('❌ No structuredData, trying regex fallback');
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
        
        for (const line of lines) {
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
  toggleServices() { 
    this.isServicesExpanded = !this.isServicesExpanded; 
  }
  
  toggleContactInfo() {
    this.isContactInfoExpanded = !this.isContactInfoExpanded;
  }
  
  toggleTeam() { 
    this.isTeamExpanded = !this.isTeamExpanded; 
  }
  
  toggleDynamic(title: string) {
      this.expandedSections[title] = !this.expandedSections[title];
  }

  // Slice Helpers (for Fold/Unfold)
  get visibleServices() {
      return this.isServicesExpanded ? this.services : this.services.slice(0, 5);
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
  
  // Add Service Methods
  startAddingService() {
    this.addingNewService = true;
  }
  
  addCustomService() {
    if (this.newServiceName.trim()) {
      this.services.push({
        name: this.newServiceName.trim(),
        price: 'Consultar',
        duration: 'Consultar',
        selected: true
      });
      this.newServiceName = '';
      this.addingNewService = false;
    }
  }
  
  cancelAddingService() {
    this.newServiceName = '';
    this.addingNewService = false;
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

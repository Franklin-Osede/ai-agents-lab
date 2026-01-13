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
  workflowId = signal<string | null>(null);
  businessName = signal('Negocio Detectado'); // New signal for scraped title
  screenshot = signal<string>('');

  // Data
  services: any[] = [];
  contactInfo: any = {};
  team: any[] = [];
  blogPosts: any[] = [];
  faqs: any[] = [];
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
  isBlogExpanded = true;
  isFaqExpanded = false;
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
      if(params['workflowId']) this.workflowId.set(params['workflowId']);
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
      
      // Services - Merge with navbar services if we already have them
      if (data.services && Array.isArray(data.services) && data.services.length > 0) {
        
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
        } else {
          // No navbar services, use AI services only
          this.services = data.services.map((s: any) => ({
            name: s.name,
            price: s.price || 'Consultar',
            duration: 'Consultar',
            selected: true
          }));
        }
      }

      // Team
      if (data.team && Array.isArray(data.team) && data.team.length > 0) {
        this.team = data.team.map((t: any) => ({
          name: t.name,
          role: t.role || 'Profesional'
        }));
        console.log('✅ Team found from StructuredData:', this.team);
      }
    } else {
      this.mapRegexFallback(metadata);
    }

    // 5. Explicit Team from Scraper (Override if better)
    if (metadata.team && Array.isArray(metadata.team) && metadata.team.length > 0) {
        this.team = metadata.team; // Prefer direct scraper extraction
        console.log('✅ Team found from Scraper:', this.team);
    }

    // 6. BLOG POSTS
    if (metadata.blogPosts && Array.isArray(metadata.blogPosts) && metadata.blogPosts.length > 0) {
        this.blogPosts = metadata.blogPosts;
        console.log('✅ Blog posts found:', this.blogPosts);
    }

    // 7. FAQS
    if (metadata.faqs && Array.isArray(metadata.faqs) && metadata.faqs.length > 0) {
        this.faqs = metadata.faqs;
        console.log('✅ FAQs found:', this.faqs);
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

  toggleBlog() {
    this.isBlogExpanded = !this.isBlogExpanded;
  }

  toggleFaq() {
    this.isFaqExpanded = !this.isFaqExpanded;
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

  get visibleBlogPosts() {
      return this.isBlogExpanded ? this.blogPosts : this.blogPosts.slice(0, 3);
  }

  get visibleFaqs() {
      return this.isFaqExpanded ? this.faqs : this.faqs.slice(0, 3);
  }

  getVisibleDynamicItems(section: any) {
      if (!section.items) return [];
      return this.expandedSections[section.title] ? section.items : section.items.slice(0, 3);
  }

  extractServicesFromText(text: string): any[] {
    const services: any[] = [];
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

    if (services.length < 2) {
      const commonServicesKeywords = [
        'fisioterapia', 'physiotherapy', 
        'osteopatía', 'osteopathy', 
        'rehabilitación', 'rehabilitation', 
        'entrenamiento', 'training', 
        'pilates', 'yoga', 
        'masaje', 'massage', 
        'suelo pélvico', 'pelvic floor',
        'punción seca', 'dry needling'
      ];

      const lines = text.split('\n').map(l => l.trim());
      lines.forEach(line => {
        if (line.length < 4 || line.length > 60) return;
        if (line.includes('Copyright') || line.includes('Policy')) return;
        const lowerLine = line.toLowerCase();
        const isService = commonServicesKeywords.some(kw => lowerLine.includes(kw));
        const exists = services.some(s => s.name.toLowerCase() === lowerLine);
        
        if (isService && !exists) {
           services.push({
             name: line,
             price: 'Consultar',
             duration: 'Consultar',
             selected: true
           });
        }
      });
    }
    return services.slice(0, 10);
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
      { name: 'Fisioterapia Deportiva', price: '50€', duration: '50 min', selected: true }
    ];
    this.contactInfo = {
      phone: '+34 600 123 456',
      email: 'demo@clinica.com',
      address: 'Calle Demo 123',
      hours: 'L-V: 09:00 - 20:00'
    };
  }

  continueToChat() {
    console.log('[Preview] Navigating to builder with ID:', this.workflowId());
    this.router.navigate(['/booking', this.niche(), 'builder'], {
        queryParams: { workflowId: this.workflowId() }
    }); 
  }

  rescan() {
    this.router.navigate(['/booking', this.niche(), 'setup']);
  }
}

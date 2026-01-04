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
  businessName = signal(''); // New signal for scraped title

  // Data
  services: any[] = [];
  contactInfo: any = {};
  team: any[] = [];
  
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
    if (metadata.title) {
      this.businessName.set(metadata.title);
    } else {
      this.businessName.set('Negocio Detectado');
    }

    // 2. Try to extract services
    if (metadata.summary) {
      const extractedServices = this.extractServicesFromText(metadata.summary);
      if (extractedServices.length > 0) {
        this.services = extractedServices;
      } else {
        // Honest fallback: No services detected
        this.services = [];
      }
    } else {
      this.services = [];
    }

    // Clear other mocks to avoid confusion
    this.contactInfo = {
        address: 'Dirección no detectada',
        hours: 'Horario no detectado',
        phone: 'Teléfono no detectado'
    };
    this.team = [];
  }

  extractServicesFromText(text: string): any[] {
    const services: any[] = [];
    // Regex clean (no unnecessary escapes)
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
    
    return services.slice(0, 6);
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

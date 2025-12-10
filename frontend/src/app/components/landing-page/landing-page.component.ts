import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Agent } from '../../shared/models/agent.model';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent {
  selectedAgent: Agent | null = null;

  // Helper map for agent details
  private agentsMap: Record<string, Agent> = {
      'booking': { 
        id: 'booking', 
        name: 'Booking Agent', 
        description: 'Gestión de citas autónoma',
        icon: 'calendar_month',
        features: ['Reservas 24/7', 'Sincronización Calendar', 'Recordatorios'],
        endpoint: '/agents/booking',
        color: 'blue'
      },
      'cart-recovery': { 
        id: 'cart-recovery', 
        name: 'Abandoned Cart', 
        description: 'Recupera ventas perdidas',
        icon: 'shopping_cart_checkout',
        features: ['Notas de Voz WhatsApp', 'Disparador Automático', 'Reportes de ROI'],
        endpoint: '/agents/cart',
        color: 'rose'
      },
      'webinar-recovery': { 
        id: 'webinar-recovery', 
        name: 'Webinar Recovery', 
        description: 'Reactiva leads perdidos',
        icon: 'video_camera_front',
        features: ['Video Personalizado', 'Resumen AI', 'Call-to-Action'],
        endpoint: '/agents/webinar',
        color: 'purple'
      },
      'invoice-chaser': {
        id: 'invoice-chaser',
        name: 'Invoice Chaser',
        description: 'Cobranza sin fricción',
        icon: 'receipt_long',
        features: ['Escalamiento Inteligente', 'Multicanal', 'Amigable'],
        endpoint: '/agents/invoice',
        color: 'amber'
      },
      'voice': { 
        id: 'voice', 
        name: 'Voice Brand', 
        description: 'Identidad vocal',
        icon: 'graphic_eq',
        features: ['Voz Natural', 'Personalización', 'Multilenguaje'],
        endpoint: '/agents/voice',
        color: 'emerald'
      }
  };

  constructor(private router: Router) {}

  navigateToProfessional(): void {
    console.log('Navigating to professional dashboard...');
    this.router.navigate(['/professional']).then(success => {
        console.log('Navigation result:', success);
        if (!success) {
            console.error('Navigation failed!');
        }
    });
  }

  openDemo(agentId: string): void {
    console.log('openDemo called with agentId:', agentId);
    if (this.agentsMap[agentId]) {
        this.selectedAgent = this.agentsMap[agentId];
        console.log('Selected agent:', this.selectedAgent);
    } else {
        console.error('Agent not found:', agentId);
    }
  }

  closeDemo(): void {
    this.selectedAgent = null;
  }
  
  toggleDarkMode(): void {
    document.documentElement.classList.toggle('dark');
  }
}

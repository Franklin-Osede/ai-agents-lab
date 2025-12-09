import { Component } from '@angular/core';
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
      'dm-response': { 
        id: 'dm-response', 
        name: 'DM Responder', 
        description: 'Atención inmediata',
        icon: 'chat_bubble',
        features: ['Respuestas Instantáneas', 'Calif. de Leads', 'Multicanal'],
        endpoint: '/agents/dm',
        color: 'emerald'
      },
      'follow-up': { 
        id: 'follow-up', 
        name: 'Follow-up Agent', 
        description: 'Reactiva leads',
        icon: 'sync',
        features: ['Secuencias Inteligentes', 'Personalización', 'Reactivación'],
        endpoint: '/agents/followup',
        color: 'orange'
      },
      'voice': { 
        id: 'voice', 
        name: 'Voice Agent', 
        description: 'Mensajes de voz',
        icon: 'mic',
        features: ['Voz Natural', 'Llamadas Salientes', 'Transcripción'],
        endpoint: '/agents/voice',
        color: 'purple'
      }
  };

  constructor() {}

  openDemo(agentId: string): void {
    if (this.agentsMap[agentId]) {
        this.selectedAgent = this.agentsMap[agentId];
    }
  }

  closeDemo(): void {
    this.selectedAgent = null;
  }
  
  toggleDarkMode(): void {
    document.documentElement.classList.toggle('dark');
  }
}

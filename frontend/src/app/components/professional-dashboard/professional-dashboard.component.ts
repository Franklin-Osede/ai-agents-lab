import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-professional-dashboard',
  templateUrl: './professional-dashboard.component.html',
  styleUrls: ['./professional-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProfessionalDashboardComponent implements OnInit {
  currentDate: string = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  
  appointments = {
    count: 6,
    pending: 2
  };

  stats = {
    growth: 12
  };

  lastConsultation = {
    name: 'Ana García',
    time: 'Hace 2 horas'
  };

  allAgents = [
    {
      id: 'booking',
      name: 'Agente de Citas',
      description: 'Agenda citas 24/7 y responde preguntas básicas.',
      icon: 'calendar_month',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      role: 'Ventas',
      status: 'active',
      endpoint: '/agents/booking'
    },
    {
      id: 'cart',
      name: 'Recuperador de Carritos',
      description: 'Contacta clientes que abandonaron su compra.',
      icon: 'shopping_cart_checkout',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      iconColor: 'text-rose-600 dark:text-rose-400',
      role: 'Ventas',
      status: 'active',
      endpoint: '/agents/abandoned-cart'
    },
    {
      id: 'webinar',
      name: 'Rescate de Webinars',
      description: 'Reactiva leads que no asistieron a tus eventos.',
      icon: 'video_camera_front',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      role: 'Marketing',
      status: 'active',
      endpoint: '/agents/webinar-recovery'
    },
    {
      id: 'invoice',
      name: 'Cobranza Inteligente',
      description: 'Gestiona facturas vencidas con amabilidad.',
      icon: 'receipt_long',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      role: 'Finanzas',
      status: 'active',
      endpoint: '/agents/invoice-chaser'
    },
    {
      id: 'rider',
      name: 'Rider Agent',
      description: 'Monitoreo en tiempo real y gestión de incidentes.',
      icon: 'two_wheeler',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      role: 'Logística',
      status: 'active',
      endpoint: '/agents/rider'
    },
    {
      id: 'voice',
      name: 'Voz de Marca',
      description: 'Identidad vocal personalizada para tu negocio.',
      icon: 'graphic_eq',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      role: 'Branding',
      status: 'active',
      endpoint: '/agents/voice-brand'
    }
  ];

  agents: any[] = [];

  get activeAgentsCount(): number {
    return this.agents.filter(a => a.status === 'active').length;
  }

  selectedAgentForIntegration: any = null;
  showIntegrationModal = false;

  ngOnInit(): void {
    this.filterAgents();
  }

  filterAgents() {
    // If enabledAgents is not defined, show all (backward compatibility)
    // Cast strict type to any to avoid TS errors if environment type isn't updated in IDE yet
    const enabled = (environment as any).enabledAgents;
    console.log('DEBUG: Enabled Agents from Env:', enabled); // DEBUG LOG
    
    if (enabled && Array.isArray(enabled)) {
      this.agents = this.allAgents.filter(agent => enabled.includes(agent.id));
      console.log('DEBUG: Filtered Agents:', this.agents); // DEBUG LOG
    } else {
      // FALLBACK: Force specific agents if env is missing (Safety net for demo)
      console.warn('DEBUG: Env enabledAgents missing, using fallback list');
      const fallbackList = ['booking', 'cart', 'voice', 'rider'];
      this.agents = this.allAgents.filter(agent => fallbackList.includes(agent.id));
    }
  }

  openIntegration(agent: any): void {
    this.selectedAgentForIntegration = agent;
    this.showIntegrationModal = true;
  }

  closeIntegration(): void {
    this.showIntegrationModal = false;
    this.selectedAgentForIntegration = null;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  }
}

import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-professional-dashboard',
  templateUrl: './professional-dashboard.component.html',
  styleUrls: ['./professional-dashboard.component.scss']
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

  agents = [
    {
      id: 'booking',
      name: 'Agente de Citas',
      description: 'Agenda citas 24/7 y responde preguntas básicas.',
      icon: 'calendar_month',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      role: 'Ventas',
      status: 'active'
    },
    {
      id: 'cart',
      name: 'Recuperador de Carritos',
      description: 'Contacta clientes que abandonaron su compra.',
      icon: 'shopping_cart_checkout',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      iconColor: 'text-rose-600 dark:text-rose-400',
      role: 'Ventas',
      status: 'active'
    },
    {
      id: 'webinar',
      name: 'Rescate de Webinars',
      description: 'Reactiva leads que no asistieron a tus eventos.',
      icon: 'video_camera_front',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      role: 'Marketing',
      status: 'active'
    },
    {
      id: 'invoice',
      name: 'Cobranza Inteligente',
      description: 'Gestiona facturas vencidas con amabilidad.',
      icon: 'receipt_long',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      role: 'Finanzas',
      status: 'active'
    },
    {
      id: 'voice',
      name: 'Voz de Marca',
      description: 'Identidad vocal personalizada para tu negocio.',
      icon: 'graphic_eq',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      role: 'Branding',
      status: 'active'
    }
  ];

  get activeAgentsCount(): number {
    return this.agents.filter(a => a.status === 'active').length;
  }

  selectedAgentForIntegration: any = null;
  showIntegrationModal: boolean = false;

  constructor() { }

  ngOnInit(): void {
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

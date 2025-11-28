import { Injectable } from '@angular/core';
import { Agent } from '../models/agent.model';

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  getAgents(): Agent[] {
    return [
      {
        id: 'booking',
        name: 'Booking Agent',
        description: 'Sistema automático de reservas de citas. Permite a tus clientes reservar citas 24/7 sin intervención manual.',
        icon: '📅',
        features: [
          'Detecta intención de reserva automáticamente',
          'Sugiere horarios disponibles en tiempo real',
          'Confirma citas y envía recordatorios',
          'Reduce no-shows con confirmaciones inteligentes',
        ],
        endpoint: 'booking',
        color: '#1e40af', // Azul oscuro profesional para reservas
      },
      {
        id: 'dm-response',
        name: 'DM Response Agent',
        description: 'Responde automáticamente a mensajes directos de Instagram, WhatsApp y Telegram. Nunca pierdas una oportunidad de venta.',
        icon: '💬',
        features: [
          'Responde en segundos, 24/7',
          'Entiende preguntas sobre precios y servicios',
          'Proporciona información instantánea',
          'Mantiene el tono profesional de tu marca',
        ],
        endpoint: 'dm-response',
        color: '#047857', // Verde oscuro para comunicación
      },
      {
        id: 'follow-up',
        name: 'Follow-up Agent',
        description: 'Sistema de seguimiento automatizado. Genera mensajes personalizados para reconectar con clientes y aumentar conversiones.',
        icon: '🔄',
        features: [
          'Rastrea interacciones con clientes',
          'Genera seguimientos personalizados',
          'Aumenta tasas de conversión',
          'Mantiene relaciones a largo plazo',
        ],
        endpoint: 'follow-up',
        color: '#c2410c', // Naranja oscuro para acción/seguimiento
      },
    ];
  }

  getAgentById(id: string): Agent | undefined {
    return this.getAgents().find((agent) => agent.id === id);
  }
}


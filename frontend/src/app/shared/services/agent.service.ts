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
        description: 'Automatic appointment booking system',
        icon: '📅',
        features: [
          'Detects booking intent',
          'Suggests available times',
          'Confirms appointments automatically',
        ],
        endpoint: 'booking',
        color: '#3B82F6',
      },
      {
        id: 'dm-response',
        name: 'DM Response Agent',
        description: 'Auto-responds to Instagram/WhatsApp messages',
        icon: '💬',
        features: [
          'Responds 24/7',
          'Understands customer intent',
          'Provides instant answers',
        ],
        endpoint: 'dm-response',
        color: '#10B981',
      },
      {
        id: 'follow-up',
        name: 'Follow-up Agent',
        description: 'Automated customer follow-up system',
        icon: '🔄',
        features: [
          'Tracks customer interactions',
          'Generates personalized follow-ups',
          'Increases conversion rates',
        ],
        endpoint: 'follow-up',
        color: '#F59E0B',
      },
    ];
  }

  getAgentById(id: string): Agent | undefined {
    return this.getAgents().find((agent) => agent.id === id);
  }
}


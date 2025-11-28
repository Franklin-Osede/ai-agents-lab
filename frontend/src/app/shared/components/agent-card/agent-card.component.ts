import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Agent } from '../../models/agent.model';

@Component({
  selector: 'app-agent-card',
  templateUrl: './agent-card.component.html',
  styleUrls: ['./agent-card.component.scss'],
})
export class AgentCardComponent {
  @Input() agent!: Agent;
  @Output() tryIt = new EventEmitter<Agent>();

  getButtonGradient(): string {
    const gradients: Record<string, string> = {
      booking: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #1e3a8a 100%)',
      'dm-response': 'linear-gradient(135deg, #047857 0%, #065f46 50%, #064e3b 100%)',
      'follow-up': 'linear-gradient(135deg, #c2410c 0%, #9a3412 50%, #7c2d12 100%)',
    };
    return gradients[this.agent.id] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  getCardGradient(): string {
    // Cards con fondo blanco/gris muy sutil, sin gradiente de color
    return 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)';
  }

  getBorderColor(): string {
    const colors: Record<string, string> = {
      booking: '#1e40af', // Azul oscuro
      'dm-response': '#047857', // Verde oscuro
      'follow-up': '#c2410c', // Naranja oscuro
    };
    return colors[this.agent.id] || '#6b7280';
  }

  onTryIt(): void {
    this.tryIt.emit(this.agent);
  }
}


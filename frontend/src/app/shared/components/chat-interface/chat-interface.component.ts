import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../models/agent.model';

@Component({
  selector: 'app-chat-interface',
  templateUrl: './chat-interface.component.html',
  styleUrls: ['./chat-interface.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ChatInterfaceComponent {
  @Input() messages: ChatMessage[] = [];
  @Input() isLoading = false;
  @Input() agentGender: 'male' | 'female' = 'female'; // Default to female
  @Output() toggleAudio = new EventEmitter<ChatMessage>();

  getAgentAvatarUrl(): string {
    // Return different avatar based on agent gender
    if (this.agentGender === 'male') {
      // Professional male avatar
      return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200';
    } else {
      // Professional female avatar
      return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200';
    }
  }

  getMessageClass(message: ChatMessage): string {
    if (message.isSystem) return 'message-system';
    return message.sender === 'user' ? 'message-user' : 'message-agent';
  }
}

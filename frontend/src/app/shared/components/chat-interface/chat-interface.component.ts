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
  @Output() toggleAudio = new EventEmitter<ChatMessage>();

  getMessageClass(message: ChatMessage): string {
    if (message.isSystem) return 'message-system';
    return message.sender === 'user' ? 'message-user' : 'message-agent';
  }
}

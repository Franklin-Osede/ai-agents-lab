import { Component, Input } from '@angular/core';
import { ChatMessage } from '../../models/agent.model';

@Component({
  selector: 'app-chat-interface',
  templateUrl: './chat-interface.component.html',
  styleUrls: ['./chat-interface.component.scss'],
})
export class ChatInterfaceComponent {
  @Input() messages: ChatMessage[] = [];
  @Input() isLoading = false;

  getMessageClass(message: ChatMessage): string {
    if (message.isSystem) return 'message-system';
    return message.sender === 'user' ? 'message-user' : 'message-agent';
  }
}


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-chat.component.html',
  styles: [`
    /* Custom scrollbar for chat area */
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #cbd5e1;
    }
  `]
})
export class AgentChatComponent {
  // Logic implementation pending
}

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Agent } from '../../models/agent.model';
import { ApiService } from '../../services/api.service';
import { ChatMessage } from '../../models/agent.model';

@Component({
  selector: 'app-demo-modal',
  templateUrl: './demo-modal.component.html',
  styleUrls: ['./demo-modal.component.scss'],
})
export class DemoModalComponent implements OnInit {
  @Input() agent!: Agent;
  @Output() close = new EventEmitter<void>();

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  metrics: {
    responseTime?: number;
    intent?: string;
    confidence?: number;
  } = {};

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.addWelcomeMessage();
  }

  addWelcomeMessage(): void {
    const welcomeMessages: Record<string, string> = {
      booking: "Hi! I'm your booking assistant. Try asking: 'I want to book an appointment tomorrow at 2pm'",
      'dm-response': "Hi! I'm your DM response agent. Try asking: 'How much does botox cost?'",
      'follow-up': "Hi! I'm your follow-up agent. I'll generate personalized follow-up messages for your customers.",
    };

    this.messages.push({
      id: 'welcome',
      content: welcomeMessages[this.agent.id] || 'Hello! How can I help you?',
      sender: 'agent',
      timestamp: new Date(),
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: this.currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    this.messages.push(userMessage);
    const messageToSend = this.currentMessage;
    this.currentMessage = '';
    this.isLoading = true;

    const startTime = Date.now();

    try {
      let response;
      switch (this.agent.id) {
        case 'booking':
          response = await this.apiService.processBooking(messageToSend).toPromise();
          break;
        case 'dm-response':
          response = await this.apiService.processDm(messageToSend).toPromise();
          break;
        case 'follow-up':
          response = await this.apiService
            .generateFollowUp(messageToSend, 3)
            .toPromise();
          break;
        default:
          throw new Error('Unknown agent');
      }

      const responseTime = Date.now() - startTime;
      this.metrics.responseTime = responseTime;
      this.metrics.intent = response?.intent?.type;
      this.metrics.confidence = response?.intent?.confidence;

      if (response) {
        const agentMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.message || response.response || 'Response received',
          sender: 'agent',
          timestamp: new Date(),
          intent: response.intent,
        };
        this.messages.push(agentMessage);
      }
    } catch (error) {
      this.messages.push({
        id: (Date.now() + 2).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'agent',
        timestamp: new Date(),
      });
    } finally {
      this.isLoading = false;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}


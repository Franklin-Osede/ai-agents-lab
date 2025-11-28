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

  onTryIt(): void {
    this.tryIt.emit(this.agent);
  }
}


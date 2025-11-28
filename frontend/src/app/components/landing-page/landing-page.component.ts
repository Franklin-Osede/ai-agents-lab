import { Component, OnInit } from '@angular/core';
import { Agent } from '../../shared/models/agent.model';
import { AgentService } from '../../shared/services/agent.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnInit {
  agents: Agent[] = [];
  selectedAgent: Agent | null = null;
  showModal = false;

  constructor(private agentService: AgentService) {}

  ngOnInit(): void {
    this.agents = this.agentService.getAgents();
  }

  openDemo(agent: Agent): void {
    this.selectedAgent = agent;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedAgent = null;
  }
}


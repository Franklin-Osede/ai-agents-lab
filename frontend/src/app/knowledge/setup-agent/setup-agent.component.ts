import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { KnowledgeService } from '../services/knowledge.service';

@Component({
  selector: 'app-setup-agent',
  templateUrl: './setup-agent.component.html',
  styleUrls: ['./setup-agent.component.css'],
})
export class SetupAgentComponent {
  url = signal('');
  isLoading = signal(false);
  error = signal('');

  constructor(
    private knowledgeService: KnowledgeService,
    private router: Router
  ) {}

  async onSubmit() {
    const urlValue = this.url().trim();
    if (!urlValue) {
      this.error.set('Por favor, introduce una URL válida');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    try {
      const tenantId = 'demo-' + Date.now();
      await this.knowledgeService.startTraining(urlValue, tenantId);
      
      // Navigate to training overlay
      this.router.navigate(['/knowledge/training']);
    } catch (err) {
      this.error.set('Error al conectar con el servidor. Intenta de nuevo.');
      this.isLoading.set(false);
    }
  }

  useDemoData() {
    this.url.set('https://example.com');
    this.onSubmit();
  }
}

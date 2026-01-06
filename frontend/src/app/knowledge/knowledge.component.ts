import { Component, inject, effect } from '@angular/core';
import { KnowledgeService } from './services/knowledge.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-knowledge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge.component.html',
  styleUrl: './knowledge.component.css'
})
export class KnowledgeComponent {
  knowledgeService = inject(KnowledgeService);
  urlInput = '';
  
  // Expose the signal directly
  progress = this.knowledgeService.trainingProgress;

  async startTraining() {
    if (!this.urlInput) return;
    try {
      // Use a dummy tenantId for now or get from session
      await this.knowledgeService.startTraining(this.urlInput, 'default-tenant');
    } catch (e) {
      console.error('Error starting training', e);
    }
  }
}

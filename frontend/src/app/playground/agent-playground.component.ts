
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-playground',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-playground.component.html',
  styles: [`
    .watermark {
      background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(80, 72, 229, 0.03) 10px, rgba(80, 72, 229, 0.03) 20px);
    }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
  `]
})
export class AgentPlaygroundComponent {
  // Logic to be implemented
}

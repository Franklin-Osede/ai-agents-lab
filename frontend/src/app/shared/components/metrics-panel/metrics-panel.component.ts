import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metrics-panel',
  templateUrl: './metrics-panel.component.html',
  styleUrls: ['./metrics-panel.component.scss'],
})
export class MetricsPanelComponent {
  @Input() metrics: {
    responseTime?: number;
    intent?: string;
    confidence?: number;
  } = {};
  @Input() agentColor = '#667eea';
}


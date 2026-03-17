
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardStreamService, DashboardEvent } from '../../services/dashboard-stream.service';

interface ThoughtLog {
  step: string;
  details: string;
  timestamp: string;
  icon: string; // '🧠', '🌍', '⚡', '✅'
  status: 'pending' | 'completed' | 'error';
}

@Component({
  selector: 'app-thinking-process',
  templateUrl: './thinking-process.component.html',
  styleUrls: ['./thinking-process.component.css']
})
export class ThinkingProcessComponent implements OnInit, OnDestroy {
  thoughts: ThoughtLog[] = [];
  isConnected = false;
  private sub: Subscription = new Subscription();
  private stream = inject(DashboardStreamService);



  ngOnInit(): void {
    // Connect to stream (using a fixed ID for demo 'client-1')
    this.stream.connect('client-1');

    this.sub = this.stream.events$.subscribe((event: DashboardEvent) => {
      if (event.type === 'connected') {
        this.isConnected = true;
        this.addLog('system', 'Connected to Agent Core.', '⚡');
      } 
      else if (event.type === 'thought_process') {
        const payload = event.payload;
        let icon = '🧠';
        
        if (payload.step === 'searching_web') icon = '🌍';
        if (payload.step === 'checking_data') icon = '🔍';
        if (payload.step === 'decision_made') icon = '🔀';
        if (payload.step === 'found_result') icon = '✅';

        this.addLog(payload.step, payload.details, icon);
      }
    });
  }

  private addLog(step: string, details: string, icon: string) {
    this.thoughts.unshift({
      step,
      details,
      timestamp: new Date().toLocaleTimeString(),
      icon,
      status: 'completed'
    });
    // Keep only last 10 thoughts
    if (this.thoughts.length > 10) this.thoughts.pop();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.stream.disconnect();
  }
}


import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardStreamService, DashboardEvent } from '../../services/dashboard-stream.service';

export interface NicheConfig {
  id: string; // 'dental', 'beauty', 'auto_repair'...
  displayName: string;
  themeColor: string; // '#00f', 'gold', 'red'
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'list' | 'calendar';
  title: string;
  data: any;
  icon?: string;
}

@Component({
  selector: 'app-live-matrix',
  templateUrl: './live-matrix.component.html',
  styleUrls: ['./live-matrix.component.css']
})
export class LiveMatrixComponent implements OnInit, OnDestroy {
  activeNiche: NicheConfig | null = null;
  private sub: Subscription = new Subscription();

  // Default templates to show "Scale"
  private nicheTemplates: Record<string, NicheConfig> = {
    'dental': {
      id: 'dental',
      displayName: 'DENTAL CLINIC AI',
      themeColor: '#00d4ff', // Cyan
      widgets: [
        { id: 'triage', type: 'list', title: 'Patient Triage', data: [] },
        { id: 'insurance', type: 'kpi', title: 'Insurance Verified', data: { value: 0, label: 'Patients' }, icon: '🛡️' },
        { id: 'calendar', type: 'calendar', title: 'Slot Fitting', data: { filled: 0 } }
      ]
    },
    'beauty': {
      id: 'beauty',
      displayName: 'BEAUTY SALON AI',
      themeColor: '#ffd700', // Gold
      widgets: [
        { id: 'upsell', type: 'kpi', title: 'Product Upsell', data: { value: 0, label: 'EUR Nextra' }, icon: '💸' },
        { id: 'lookbook', type: 'list', title: 'Lookbook History', data: [] },
        { id: 'stock', type: 'list', title: 'Stock Alerts', data: [] }
      ]
    },
    'generic': {
      id: 'generic',
      displayName: 'UNIVERSAL BUSINESS AI',
      themeColor: '#00ff00', // Matrix Green
      widgets: [
        { id: 'leads', type: 'list', title: 'Incoming Leads', data: [] },
        { id: 'revenue', type: 'kpi', title: 'Potential Revenue', data: { value: 0, label: 'EUR' }, icon: '💰' }
      ]
    }
  };

  private stream = inject(DashboardStreamService);



  ngOnInit(): void {
    this.stream.events$.subscribe((event: DashboardEvent) => {
      // 1. Detect Niche from Thinking Process or Config Event
      // For now, if we see 'dental' logic in events, switch to Dental
      if (this.activeNiche?.id !== 'dental' && event.type.startsWith('dental')) {
        this.setNiche('dental');
      }
      if (this.activeNiche?.id !== 'restaurant' && event.type.startsWith('restaurant')) {
        this.setNiche('generic'); // Using generic for Restaurant for now
      }

      // 2. Route Data to Widgets
      if (this.activeNiche) {
        this.updateWidgets(event);
      }
    });

    // Start with Dental for the specific demo flow
    this.setNiche('dental'); 
  }

  setNiche(nicheId: string) {
    if (this.nicheTemplates[nicheId]) {
      this.activeNiche = this.nicheTemplates[nicheId];
    } else {
      this.activeNiche = { ...this.nicheTemplates['generic'], displayName: `${nicheId.toUpperCase()} AI` };
    }
  }

  updateWidgets(event: DashboardEvent) {
    if (!this.activeNiche) return;

    if (event.type === 'dental_patient_lookup' && this.activeNiche.id === 'dental') {
       const w = this.activeNiche.widgets.find(x => x.id === 'triage');
       if (w) w.data.unshift({ text: `Patient: ${event.payload.name}`, status: event.payload.found ? 'Found' : 'New' });
    }
    
    if (event.type === 'dental_insurance_verified' && this.activeNiche.id === 'dental') {
        const w = this.activeNiche.widgets.find(x => x.id === 'insurance');
        if (w) w.data.value += 1;
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}

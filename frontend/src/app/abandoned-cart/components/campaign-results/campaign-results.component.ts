import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AbandonedCartService } from '../../services/abandoned-cart.service';
import { CampaignResultDetail, CampaignResults } from '../../models/cart.model';

@Component({
  selector: 'app-campaign-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './campaign-results.component.html',
  styleUrl: './campaign-results.component.scss',
})
export class CampaignResultsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(AbandonedCartService);

  results = signal<CampaignResults | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  toastMessage = signal<string | null>(null);
  campaignName = signal<string>('Recuperación Verano 2024');
  lastUpdated = signal<Date | null>(null);

  pendingCount = computed(() => {
    const current = this.results();
    if (!current) return 0;
    return current.details.filter((detail) => detail.status !== 'RECOVERED').length;
  });

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private buildMockDetails(): CampaignResultDetail[] {
    const names = ['Juan Pérez', 'Maria Garcia', 'Luis Rodriguez', 'Ana Soto', 'Pedro Sánchez', 'Laura Méndez'];
    const statuses: CampaignResultDetail['status'][] = ['RECOVERED', 'PENDING', 'SENT', 'IGNORED'];
    return Array.from({ length: this.getRandomInt(3, 6) }).map((_, idx) => {
      const name = names[(idx + this.getRandomInt(0, names.length - 1)) % names.length];
      const status = statuses[this.getRandomInt(0, statuses.length - 1)];
      return {
        customerId: `customer-${idx}-${Date.now()}`,
        customerName: name,
        status,
        value: Number((Math.random() * 400 + 50).toFixed(2)),
        timestamp: new Date(Date.now() - this.getRandomInt(10, 120) * 60 * 1000),
      };
    });
  }

  ngOnInit(): void {
    // Load campaign results
    this.loadResults();
  }

  loadResults(): void {
    this.loading.set(true);
    this.error.set(null);

    // Simulate async fetch for demo
    setTimeout(() => {
      try {
        const details = this.buildMockDetails();
        const recovered = details.filter((d) => d.status === 'RECOVERED').length;
        this.results.set({
          totalSent: this.getRandomInt(320, 820),
          totalOpened: this.getRandomInt(200, 600),
          totalRecovered: recovered,
          totalValue: Number(details.reduce((sum, d) => sum + d.value, 0).toFixed(0)),
          roi: this.getRandomInt(300, 520),
          recoveryRate: Math.max(8, Math.min(40, Math.round((recovered / details.length) * 100))),
          details,
        });
        this.lastUpdated.set(new Date());
      } catch (err) {
        console.error(err);
        this.error.set('No pudimos cargar los resultados. Intenta de nuevo.');
      } finally {
        this.loading.set(false);
      }
    }, 600);
  }

  resendToNonResponded(): void {
    const pending = this.pendingCount();
    if (!pending) {
      this.showToast('No hay pendientes para reenviar');
      return;
    }
    this.showToast(`Reenviando a ${pending} contacto(s) pendientes...`);
  }

  goBack(): void {
    window.history.back();
  }

  resendSingle(detail: CampaignResultDetail): void {
    this.showToast(`Reenviado a ${detail.customerName}`);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 2000);
  }
}

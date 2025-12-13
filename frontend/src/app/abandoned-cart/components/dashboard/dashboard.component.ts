import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AbandonedCartService } from '../../services/abandoned-cart.service';
import { CartMetrics } from '../../models/cart.model';
import { ThemeService } from '../../../shared/services/theme.service';

/**
 * Dashboard Component
 * 
 * Main dashboard for abandoned cart recovery
 * Shows metrics, trends, and quick actions
 * 
 * Angular 17+ Best Practices:
 * - Standalone component
 * - Signals for reactive state
 * - OnPush change detection ready
 */
@Component({
  selector: 'app-abandoned-cart-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AbandonedCartDashboardComponent implements OnInit {
  private readonly cartService = inject(AbandonedCartService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  // Signals for reactive state
  metrics = signal<CartMetrics | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  greeting = signal<string>('Bienvenido de vuelta');

  ngOnInit(): void {
    this.updateWelcomeMessage();
    this.loadMetrics();
  }

  private updateWelcomeMessage(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting.set('Buenos días');
    } else if (hour < 18) {
      this.greeting.set('Buenas tardes');
    } else {
      this.greeting.set('Buenas noches');
    }
  }

  private loadMetrics(): void {
    this.loading.set(true);
    this.error.set(null);

    this.cartService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error loading metrics');
        this.loading.set(false);
        // Set mock data for development
        this.metrics.set({
          abandonedToday: Math.floor(Math.random() * (200 - 100 + 1)) + 100,
          totalValue: 12400,
          recoveryRate: 18.5,
          recoveredRevenue: 2300,
          abandonedTodayChange: 12,
          totalValueChange: 5,
          recoveryRateChange: 2.1,
          recoveredRevenueChange: 8,
        });
      },
    });
  }

  refreshMetrics(): void {
    this.loadMetrics();
  }

  goBack(): void {
    // Navigate back to landing page
    this.router.navigate(['/']);
  }

  /**
   * Handle click on metric cards
   * Navigates to filtered views or detailed analytics
   */
  onMetricClick(metric: 'abandoned-today' | 'total-value' | 'recovery-rate' | 'recovered-revenue'): void {
    switch (metric) {
      case 'abandoned-today':
        // Navigate to cart list filtered by today
        this.router.navigate(['/abandoned-cart/list'], {
          queryParams: { filter: 'today' }
        });
        break;
      
      case 'total-value':
        // Navigate to cart list sorted by value
        this.router.navigate(['/abandoned-cart/list'], {
          queryParams: { sort: 'value', order: 'desc' }
        });
        break;
      
      case 'recovery-rate':
        // Navigate to new performance analytics view
        this.router.navigate(['/abandoned-cart/performance']);
        break;
      
      case 'recovered-revenue':
        // Navigate to cart list filtered by recovered status
        this.router.navigate(['/abandoned-cart/list'], {
          queryParams: { status: 'RECOVERED' }
        });
        break;
    }
  }

  /**
   * Handle click on quick action buttons
   */
  onQuickActionClick(action: 'automation'): void {
    switch (action) {
      case 'automation':
        // Navigate to automation settings or show modal
        // For now, navigate to campaigns page where automation can be configured
        this.router.navigate(['/abandoned-cart/campaign/new'], {
          queryParams: { mode: 'automation' }
        });
        break;
    }
  }
}


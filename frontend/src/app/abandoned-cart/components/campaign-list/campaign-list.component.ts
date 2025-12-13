import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AbandonedCartService } from '../../services/abandoned-cart.service';
import { Campaign } from '../../models/cart.model';

/**
 * Campaign List Component
 * 
 * Displays list of campaigns (active, completed, draft)
 */
@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NgClass],
  templateUrl: './campaign-list.component.html',
  styleUrl: './campaign-list.component.scss',
})
export class CampaignListComponent implements OnInit {
  private readonly cartService = inject(AbandonedCartService);

  campaigns = signal<Campaign[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<'active' | 'completed' | 'draft'>('active');

  ngOnInit(): void {
    this.loadCampaigns();
  }

  private loadCampaigns(): void {
    this.loading.set(true);
    // Mock data for now - in production this would come from service
    this.campaigns.set([
      {
        id: 'campaign-1',
        name: 'Recuperación Verano 2024',
        status: 'COMPLETED',
        audience: { type: 'abandoned_today', count: 500 },
        message: { type: 'email', content: 'Completa tu compra con 15% de descuento' },
        offer: { type: 'percentage', value: 15, code: 'VERANO15', expirationHours: 48 },
        sentAt: new Date('2024-10-12'),
        results: {
          totalSent: 500,
          totalOpened: 345,
          totalRecovered: 75,
          totalValue: 12450,
          roi: 450,
          recoveryRate: 15,
          details: []
        }
      },
      {
        id: 'campaign-2',
        name: 'Flash Sale 24h',
        status: 'ACTIVE',
        audience: { type: 'high_value', count: 200 },
        message: { type: 'whatsapp', content: 'Oferta especial solo por hoy' },
        offer: { type: 'percentage', value: 20, code: 'FLASH20', expirationHours: 24 },
        sentAt: new Date()
      },
      {
        id: 'campaign-3',
        name: 'Welcome Series',
        status: 'ACTIVE',
        audience: { type: 'new_customers', count: 150 },
        message: { type: 'email', content: 'Bienvenido a nuestra tienda' },
        offer: { type: 'free_shipping', value: 0, code: 'WELCOME', expirationHours: 72 }
      },
      {
        id: 'campaign-4',
        name: 'VIP Recovery',
        status: 'DRAFT',
        audience: { type: 'vip', count: 50 },
        message: { type: 'email', content: 'Oferta exclusiva para VIP' },
        offer: { type: 'percentage', value: 25, code: 'VIP25', expirationHours: 96 }
      }
    ]);
    this.loading.set(false);
  }

  getFilteredCampaigns(): Campaign[] {
    const all = this.campaigns();
    switch (this.activeTab()) {
      case 'active':
        return all.filter(c => c.status === 'ACTIVE');
      case 'completed':
        return all.filter(c => c.status === 'COMPLETED');
      case 'draft':
        return all.filter(c => c.status === 'DRAFT');
      default:
        return all;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  }

  goBack(): void {
    window.history.back();
  }
}


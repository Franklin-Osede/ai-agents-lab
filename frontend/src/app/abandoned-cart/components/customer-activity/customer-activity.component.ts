import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AbandonedCartService } from '../../services/abandoned-cart.service';
import { Cart, Customer } from '../../models/cart.model';

@Component({
  selector: 'app-customer-activity',
  standalone: true,
  imports: [CommonModule, RouterModule, NgClass],
  templateUrl: './customer-activity.component.html',
  styleUrl: './customer-activity.component.scss',
})
export class CustomerActivityComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(AbandonedCartService);

  customer = signal<Customer | null>(null);
  customerCarts = signal<Cart[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  activeTab = signal<'viewed' | 'carts' | 'purchases' | 'interactions'>('carts');

  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('id');
    if (customerId) {
      this.loadCustomerData(customerId);
    }
  }

  private loadCustomerData(customerId: string): void {
    this.loading.set(true);
    this.error.set(null);
    // Load customer and their carts
    this.cartService.getAbandonedCarts().subscribe({
      next: (carts) => {
        const filteredCarts = carts.filter(c => c.customer?.id === customerId);
        this.customerCarts.set(filteredCarts);
        if (filteredCarts.length > 0 && filteredCarts[0].customer) {
          this.customer.set(filteredCarts[0].customer);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error loading customer data');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: 'viewed' | 'carts' | 'purchases' | 'interactions'): void {
    this.activeTab.set(tab);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Hace poco';
    }
  }

  goBack(): void {
    window.history.back();
  }

}


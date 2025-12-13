import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AbandonedCartService } from '../../services/abandoned-cart.service';
import { Cart } from '../../models/cart.model';

/**
 * Cart Detail Component
 * 
 * Shows detailed view of an abandoned cart with recovery actions
 */
@Component({
  selector: 'app-cart-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-detail.component.html',
  styleUrl: './cart-detail.component.scss',
})
export class CartDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cartService = inject(AbandonedCartService);

  cart = signal<Cart | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const cartId = this.route.snapshot.paramMap.get('id');
    if (cartId) {
      this.loadCart(cartId);
    }
  }

  private loadCart(cartId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.cartService.getCartById(cartId).subscribe({
      next: (cart) => {
        this.cart.set(cart);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error loading cart');
        this.loading.set(false);
      },
    });
  }

  recoverCart(): void {
    const cart = this.cart();
    if (!cart) return;

    this.cartService.triggerRecovery(60).subscribe({
      next: () => {
        // Reload cart to get updated status
        this.loadCart(cart.id);
      },
      error: (err) => {
        console.error('Error recovering cart:', err);
      },
    });
  }

  markAsLost(): void {
    const cart = this.cart();
    if (!cart) return;

    this.cartService.markAsLost(cart.id).subscribe({
      next: () => {
        this.router.navigate(['/abandoned-cart/list']);
      },
      error: (err) => {
        console.error('Error marking cart as lost:', err);
      },
    });
  }

  goBack(): void {
    window.history.back();
  }

  getTimeString(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}


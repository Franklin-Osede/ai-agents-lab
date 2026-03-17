import { Component, inject } from '@angular/core';

import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../../shared/services/theme.service';

/**
 * Mobile Layout Component
 * 
 * Wraps abandoned cart screens in a mobile frame container
 * Similar to the booking agent demo modal
 */
@Component({
  selector: 'app-mobile-layout',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './mobile-layout.component.html',
  styleUrl: './mobile-layout.component.scss',
})
export class MobileLayoutComponent {
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  get bgImage(): string {
    if (this.router.url.includes('/booking')) {
      // Use a reliable Unsplash image for Medical/Dental vibe as requested
      return 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2068&auto=format&fit=crop'; 
    }
    return 'assets/ecommerce-background.png';
  }

  get isBooking(): boolean {
    return this.router.url.includes('/booking');
  }

  close(): void {
    // Navigate back to landing page when clicking overlay
    this.router.navigate(['/']);
  }
}


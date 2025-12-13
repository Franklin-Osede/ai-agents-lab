import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, RouterModule],
  templateUrl: './mobile-layout.component.html',
  styleUrl: './mobile-layout.component.scss',
})
export class MobileLayoutComponent {
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  close(): void {
    // Navigate back to landing page when clicking overlay
    this.router.navigate(['/']);
  }
}


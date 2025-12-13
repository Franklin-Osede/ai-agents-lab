import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from './shared/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  title = 'Agentics';
  isAbandonedCartRoute = false;

  ngOnInit(): void {
    // Check initial route
    this.updateRouteClass();
    
    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateRouteClass();
      });
  }

  private updateRouteClass(): void {
    const url = this.router.url;
    this.isAbandonedCartRoute = url.startsWith('/abandoned-cart');
    
    // Add/remove class to body for styling
    if (this.isAbandonedCartRoute) {
      document.body.classList.add('abandoned-cart-route');
    } else {
      document.body.classList.remove('abandoned-cart-route');
    }
  }
}


import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.supabaseService.user$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        }
        // Redirect to login if not authenticated
        return this.router.createUrlTree(['/login']);
      })
    );
  }
}

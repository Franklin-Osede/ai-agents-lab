import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.key);
    
    // Load initial session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUser.next(session?.user ?? null);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.next(session?.user ?? null);
    });
  }

  get user$(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  get session(): Observable<Session | null> {
    return new Observable(observer => {
      this.supabase.auth.getSession().then(({ data: { session } }) => {
        observer.next(session);
        observer.complete();
      });
    });
  }

  async signInWithMagicLink(email: string) {
    if (!environment.production && email === 'admin@admin.com') {
      console.warn('DEV BYPASS: Auto-login enabled for admin@admin.com');
      this.currentUser.next({ id: 'dev-admin-pass', email, role: 'admin' } as User);
      return { data: {}, error: null };
    }
    return await this.supabase.auth.signInWithOtp({ email });
  }

  async signIn(email: string, password?: string) {
    if (password) {
      return await this.supabase.auth.signInWithPassword({ email, password });
    }
    // Fallback to OTP if no password (for testing or magic links)
    return await this.supabase.auth.signInWithOtp({ email });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }
}

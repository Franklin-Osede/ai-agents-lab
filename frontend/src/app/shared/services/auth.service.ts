import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'professional' | 'client';
  createdAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'ai_agents_auth';
  private readonly USERS_KEY = 'ai_agents_users';

  private authState$ = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  constructor() {
    this.loadAuthState();
  }

  /**
   * Get current authentication state as observable
   */
  getAuthState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.authState$.value.isAuthenticated;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.authState$.value.user;
  }

  /**
   * Register a new user
   */
  register(email: string, password: string, name: string, role: 'professional' | 'client'): { success: boolean; error?: string } {
    try {
      // Get existing users
      const users = this.getUsers();

      // Check if email already exists
      if (users.some((u) => u.email === email)) {
        return { success: false, error: 'Este email ya está registrado' };
      }

      // Create new user
      const newUser: User & { password: string } = {
        id: this.generateId(),
        email,
        password, // In production, this should be hashed
        name,
        role,
        createdAt: new Date(),
      };

      // Save user
      users.push(newUser);
      this.saveUsers(users);

      // Auto-login after registration
      const { password: _, ...userWithoutPassword } = newUser;
      this.setAuthState(true, userWithoutPassword);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al registrar usuario' };
    }
  }

  /**
   * Login user
   */
  login(email: string, password: string): { success: boolean; error?: string } {
    try {
      const users = this.getUsers();
      const user = users.find((u) => u.email === email && u.password === password);

      if (!user) {
        return { success: false, error: 'Email o contraseña incorrectos' };
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;
      this.setAuthState(true, userWithoutPassword);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al iniciar sesión' };
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    this.setAuthState(false, null);
  }

  /**
   * Load authentication state from localStorage
   */
  private loadAuthState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const authState: AuthState = JSON.parse(stored);
        // Restore dates
        if (authState.user) {
          authState.user.createdAt = new Date(authState.user.createdAt);
        }
        this.authState$.next(authState);
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
  }

  /**
   * Set authentication state and persist to localStorage
   */
  private setAuthState(isAuthenticated: boolean, user: User | null): void {
    const newState: AuthState = { isAuthenticated, user };
    this.authState$.next(newState);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
  }

  /**
   * Get all users from localStorage
   */
  private getUsers(): (User & { password: string })[] {
    try {
      const stored = localStorage.getItem(this.USERS_KEY);
      if (stored) {
        const users = JSON.parse(stored);
        // Restore dates
        return users.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  /**
   * Save users to localStorage
   */
  private saveUsers(users: (User & { password: string })[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

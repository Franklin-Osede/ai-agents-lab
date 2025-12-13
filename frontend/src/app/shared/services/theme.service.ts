import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

/**
 * Theme Service
 * 
 * Manages application-wide theme (light/dark mode)
 * Persists preference in localStorage
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private readonly prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  // Signal for current theme
  private readonly _theme = signal<Theme>(this.getInitialTheme());
  
  // Public readonly signal
  readonly theme = this._theme.asReadonly();

  constructor() {
    // Apply theme on initialization
    this.applyTheme(this._theme());

    // Watch for system preference changes
    this.prefersDark.addEventListener('change', (e) => {
      if (!localStorage.getItem(this.THEME_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Effect to apply theme when it changes (runs in injection context)
    effect(() => {
      this.applyTheme(this._theme());
    });
  }

  /**
   * Get initial theme from localStorage or system preference
   */
  private getInitialTheme(): Theme {
    const saved = localStorage.getItem(this.THEME_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return this.prefersDark.matches ? 'dark' : 'light';
  }

  /**
   * Toggle between light and dark mode
   */
  toggleTheme(): void {
    this.setTheme(this._theme() === 'light' ? 'dark' : 'light');
  }

  /**
   * Set theme explicitly
   */
  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode(): boolean {
    return this._theme() === 'dark';
  }
}


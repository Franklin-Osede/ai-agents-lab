import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type LanguageCode = 'es' | 'en' | 'fr' | 'it' | 'pt' | 'de';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly STORAGE_KEY = 'selectedLanguage';
  private readonly DEFAULT_LANGUAGE: LanguageCode = 'es';

  private currentLanguageSubject: BehaviorSubject<LanguageCode>;
  public currentLanguage$: Observable<LanguageCode>;

  private readonly supportedLanguages: Language[] = [
    { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  ];

  private translate = inject(TranslateService);

  constructor() {
    // Load saved language or use default
    const savedLanguage = this.loadLanguageFromStorage();
    this.currentLanguageSubject = new BehaviorSubject<LanguageCode>(savedLanguage);
    this.currentLanguage$ = this.currentLanguageSubject.asObservable();

    // Configure ngx-translate
    this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);
    this.translate.use(savedLanguage);
  }

  /**
   * Get current selected language
   */
  getCurrentLanguage(): LanguageCode {
    return this.currentLanguageSubject.value;
  }

  /**
   * Set new language
   */
  setLanguage(code: LanguageCode): void {
    if (this.isValidLanguage(code)) {
      this.translate.use(code);
      this.currentLanguageSubject.next(code);
      this.saveLanguageToStorage(code);
    }
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): Language[] {
    return this.supportedLanguages;
  }

  /**
   * Get language metadata by code
   */
  getLanguageByCode(code: LanguageCode): Language | undefined {
    return this.supportedLanguages.find((lang) => lang.code === code);
  }

  /**
   * Check if language code is valid
   */
  private isValidLanguage(code: string): code is LanguageCode {
    return this.supportedLanguages.some((lang) => lang.code === code);
  }

  /**
   * Load language from localStorage
   */
  private loadLanguageFromStorage(): LanguageCode {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved && this.isValidLanguage(saved)) {
      return saved;
    }
    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Save language to localStorage
   */
  private saveLanguageToStorage(code: LanguageCode): void {
    localStorage.setItem(this.STORAGE_KEY, code);
  }
}

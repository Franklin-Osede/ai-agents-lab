import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService, Language } from './translation.service';

describe('TranslationService (TDD)', () => {
  let service: TranslationService;
  let translateService: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [TranslationService],
    });
    service = TestBed.inject(TranslationService);
    translateService = TestBed.inject(TranslateService);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have default language as Spanish', () => {
      expect(service.getCurrentLanguage()).toBe('es');
    });

    it('should load all 6 supported languages', () => {
      const supportedLanguages = service.getSupportedLanguages();
      expect(supportedLanguages.length).toBe(6);
      expect(supportedLanguages.map(l => l.code)).toEqual(['es', 'en', 'fr', 'it', 'pt', 'de']);
    });
  });

  describe('Language Switching', () => {
    it('should switch to English', (done) => {
      service.setLanguage('en');
      service.currentLanguage$.subscribe(lang => {
        expect(lang).toBe('en');
        done();
      });
    });

    it('should switch to French', (done) => {
      service.setLanguage('fr');
      service.currentLanguage$.subscribe(lang => {
        expect(lang).toBe('fr');
        done();
      });
    });

    it('should switch to Italian', (done) => {
      service.setLanguage('it');
      service.currentLanguage$.subscribe(lang => {
        expect(lang).toBe('it');
        done();
      });
    });

    it('should switch to Portuguese', (done) => {
      service.setLanguage('pt');
      service.currentLanguage$.subscribe(lang => {
        expect(lang).toBe('pt');
        done();
      });
    });

    it('should switch to German', (done) => {
      service.setLanguage('de');
      service.currentLanguage$.subscribe(lang => {
        expect(lang).toBe('de');
        done();
      });
    });

    it('should emit language change event', (done) => {
      let emitted = false;
      service.currentLanguage$.subscribe(() => {
        emitted = true;
      });
      
      service.setLanguage('en');
      
      setTimeout(() => {
        expect(emitted).toBe(true);
        done();
      }, 100);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save language to localStorage', () => {
      service.setLanguage('en');
      expect(localStorage.getItem('selectedLanguage')).toBe('en');
    });

    it('should load language from localStorage on init', () => {
      localStorage.setItem('selectedLanguage', 'fr');
      const newService = new TranslationService(translateService);
      expect(newService.getCurrentLanguage()).toBe('fr');
    });

    it('should use default language if localStorage is empty', () => {
      expect(service.getCurrentLanguage()).toBe('es');
    });

    it('should use default language if localStorage has invalid value', () => {
      localStorage.setItem('selectedLanguage', 'invalid');
      const newService = new TranslationService(translateService);
      expect(newService.getCurrentLanguage()).toBe('es');
    });
  });

  describe('Language Metadata', () => {
    it('should return correct language name for Spanish', () => {
      const lang = service.getLanguageByCode('es');
      expect(lang?.name).toBe('Español');
    });

    it('should return correct flag for English', () => {
      const lang = service.getLanguageByCode('en');
      expect(lang?.flag).toBe('🇬🇧');
    });

    it('should return correct native name for French', () => {
      const lang = service.getLanguageByCode('fr');
      expect(lang?.nativeName).toBe('Français');
    });

    it('should return undefined for invalid language code', () => {
      const lang = service.getLanguageByCode('invalid' as any);
      expect(lang).toBeUndefined();
    });
  });

  describe('Translation Integration', () => {
    it('should call TranslateService.use when changing language', () => {
      spyOn(translateService, 'use');
      service.setLanguage('en');
      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('should set default language on TranslateService', () => {
      spyOn(translateService, 'setDefaultLang');
      const newService = new TranslationService(translateService);
      expect(translateService.setDefaultLang).toHaveBeenCalledWith('es');
    });
  });
});

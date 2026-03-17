import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  type: 'neural' | 'standard';
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/voice`; // Adjust if your env is different
  
  // In-memory cache for blobs to avoid re-fetching same text/voice combo
  private audioCache = new Map<string, string>(); // Key -> BlobURL

  // The 8 voices supported by backend (Polly)
  readonly AVAILABLE_VOICES: Voice[] = [
    // Neural Voices (Premium/Lifelike)
    { id: 'Lucia', name: 'Lucía', gender: 'female', type: 'neural', language: 'es-ES' },
    { id: 'Sergio', name: 'Sergio', gender: 'male', type: 'neural', language: 'es-ES' },
    { id: 'Mia', name: 'Mia', gender: 'female', type: 'neural', language: 'es-MX' },
    { id: 'Lupe', name: 'Lupe', gender: 'female', type: 'neural', language: 'es-US' },
    
    // Standard Voices
    { id: 'Enrique', name: 'Enrique', gender: 'male', type: 'standard', language: 'es-ES' },
    { id: 'Conchita', name: 'Conchita', gender: 'female', type: 'standard', language: 'es-ES' },
    { id: 'Miguel', name: 'Miguel', gender: 'male', type: 'standard', language: 'es-US' },
    { id: 'Penelope', name: 'Penélope', gender: 'female', type: 'standard', language: 'es-US' }
  ];



  getAvailableVoices(): Voice[] {
    return this.AVAILABLE_VOICES;
  }

  /**
   * Preloads audio into cache without playing it.
   */
  preload(text: string, voiceId: string): void {
    const key = `${voiceId}:${text}`;
    if (this.audioCache.has(key)) return;

    this.speak(text, voiceId).subscribe();
  }

  /**
   * Requests audio from backend and returns a Blob URL.
   */
  speak(text: string, voiceId: string): Observable<string> {
    const key = `${voiceId}:${text}`;
    if (this.audioCache.has(key)) {
      return of(this.audioCache.get(key)!);
    }

    return this.http.post(`${this.apiUrl}/speak`, { text, voiceId }, { responseType: 'blob' })
      .pipe(
        map(blob => {
          const url = URL.createObjectURL(blob);
          this.audioCache.set(key, url);
          return url;
        }),
        catchError(err => {
          console.error('TTS Error:', err);
          return of(''); // Handle error gracefully
        })
      );
  }
}

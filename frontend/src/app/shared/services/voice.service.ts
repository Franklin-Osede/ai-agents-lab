import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private http = inject(HttpClient);
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  // API URL - reusing abandoned cart agent prefix for now as the controller lives there
  // Ideally this would be a shared endpoint
  private apiUrl = `${environment.apiBaseUrl || 'http://localhost:3005/api/v1'}/agents/voice`;

  /**
   * Start recording audio from microphone
   */
  async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start();
  }

  /**
   * Stop recording and return the audio Blob
   */
  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return resolve(new Blob());

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      // Stop all tracks to release mic
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }

  /**
   * Send audio to backend and get response audio + text
   */
  async interact(audioBlob: Blob, systemPrompt?: string): Promise<{ audio: Blob, userText: string, aiText: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    if (systemPrompt) {
      formData.append('systemPrompt', systemPrompt);
    }

    const response = await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/interact`, 
        formData, 
        { 
          responseType: 'blob', // Important! Expecting binary audio back
          observe: 'response'   // We need headers for the text transcripts
        }
      )
    );

    const audioResponse = response.body as Blob;
    const userText = decodeURIComponent(response.headers.get('X-Transcript-User') || '');
    const aiText = decodeURIComponent(response.headers.get('X-Transcript-AI') || '');

    return {
      audio: audioResponse,
      userText,
      aiText
    };
  }

  /**
   * Generate greeting audio from text (TTS only, no STT)
   */
  async generateGreeting(text: string): Promise<Blob> {
    const response = await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/generate-greeting`,
        { text },
        { responseType: 'blob' }
      )
    );
    return response;
  }

  /**
   * Helper to play a blob audio
   */
  playAudioBlob(blob: Blob): HTMLAudioElement {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    return audio;
  }
}

import { Injectable, signal, WritableSignal, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class PollyTTSService {
  private http = inject(HttpClient);
  private currentAudio: HTMLAudioElement | null = null;
  public isAgentSpeaking: WritableSignal<boolean> = signal(false);

  // Dynamic Voice Selection
  // User requested more variety. Adding Mexican and US Spanish Neural voices to the pool.
  private readonly AVAILABLE_VOICES = [
    "Lucia",
    "Sergio",
    "Mia",
    "Andres",
    "Lupe",
  ];
  public assignedVoiceId = "Lucia";

  constructor() {
    // Voice is now set dynamically based on service category
    // Default voice will be used until setVoice() is called
  }

  /**
   * Assigns a random voice for this session to create variety.
   * Public so it can be triggered when starting a new flow.
   */
  public randomizeVoice() {
    const randomIndex = Math.floor(
      Math.random() * this.AVAILABLE_VOICES.length
    );
    this.assignedVoiceId = this.AVAILABLE_VOICES[randomIndex];
    console.log(`[PollyTTS] 🎲 Assigned New Voice: ${this.assignedVoiceId}`);
  }

  public setVoice(voiceId: string) {
    if (this.AVAILABLE_VOICES.includes(voiceId)) {
      this.assignedVoiceId = voiceId;
      console.log(`[PollyTTS] Voice manually set to: ${voiceId}`);
    }
  }

  public getVoiceGender(voiceId: string = this.assignedVoiceId): 'male' | 'female' {
    // Known AWS Polly genders
    const males = ['Sergio', 'Andres', 'Pedro'];
    return males.includes(voiceId) ? 'male' : 'female';
  }

  /**
   * Speak text using AWS Polly - OPTIMIZED for instant playback
   */
  speak(text: string): void {
    if (!text) return;

    // Stop any current audio
    this.stop();

    const startTime = performance.now();
    console.log(`[PollyTTS] 🎤 Speaking: "${text.substring(0, 50)}..."`);

    // Create audio element
    this.currentAudio = new Audio();
    this.isAgentSpeaking.set(true);

    // Build URL with query params (GET request for better caching)
    const params = new URLSearchParams({
      text: text,
      voiceId: this.assignedVoiceId,
    });

    // Use POST via fetch to get blob, then create object URL
    fetch(`${environment.apiBaseUrl}/voice/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId: this.assignedVoiceId }),
    })
      .then((response) => response.blob())
      .then((blob) => {
        if (!this.currentAudio) return; // Stopped before load

        const url = URL.createObjectURL(blob);
        this.currentAudio.src = url;

        // Play immediately when ready
        this.currentAudio.onloadeddata = () => {
          const loadTime = performance.now() - startTime;
          console.log(
            `[PollyTTS] ⚡ Loaded in ${loadTime.toFixed(0)}ms, playing now`
          );
          this.currentAudio?.play().catch((err) => {
            console.error("[PollyTTS] Playback error:", err);
            this.isAgentSpeaking.set(false);
          });
          URL.revokeObjectURL(url);
        };

        this.currentAudio.onended = () => {
          const totalTime = performance.now() - startTime;
          console.log(
            `[PollyTTS] ✅ Finished (total: ${totalTime.toFixed(0)}ms)`
          );
          this.isAgentSpeaking.set(false);
          this.currentAudio = null;
        };

        this.currentAudio.onerror = (error) => {
          console.error("[PollyTTS] Audio error:", error);
          this.isAgentSpeaking.set(false);
          this.currentAudio = null;
          URL.revokeObjectURL(url);
        };
      })
      .catch((error) => {
        console.error("[PollyTTS] Fetch error:", error);
        this.isAgentSpeaking.set(false);
        this.currentAudio = null;
      });
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isAgentSpeaking.set(false);
  }
}

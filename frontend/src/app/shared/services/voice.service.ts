import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class VoiceService {
  private http = inject(HttpClient);
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recognition: any; // Web Speech API instance

  // Audio cache to avoid regenerating same messages
  private audioCache = new Map<string, Blob>();

  // API URL - reusing abandoned cart agent prefix for now as the controller lives there
  // Ideally this would be a shared endpoint
  private apiUrl = `${
    environment.apiBaseUrl || "http://localhost:3005/api/v1"
  }/agents/voice`;

  /**
   * Start recording audio from microphone
   */
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      throw error;
    }
  }

  /**
   * Stop recording and return the audio Blob
   */
  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        return resolve(new Blob());
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        this.audioChunks = [];
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    });
  }

  /**
   * Send audio to backend and get response audio + text
   */
  async interact(
    audioBlob: Blob,
    systemPrompt?: string
  ): Promise<{ audio: Blob; userText: string; aiText: string }> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    if (systemPrompt) {
      formData.append("systemPrompt", systemPrompt);
    }

    try {
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/interact`, formData, {
          responseType: "blob", // Important! Expecting binary audio back
          observe: "response", // We need headers for the text transcripts
        })
      );

      const audioResponse = response.body as Blob;
      const userText = decodeURIComponent(
        response.headers.get("X-Transcript-User") || ""
      );
      const aiText = decodeURIComponent(
        response.headers.get("X-Transcript-AI") || ""
      );

      return {
        audio: audioResponse,
        userText,
        aiText,
      };
    } catch (error) {
      console.error("Voice interaction error:", error);
      return {
        audio: new Blob(),
        userText: "Error de conexión",
        aiText:
          "Lo siento, el servicio de voz no está disponible en este momento. (Modo Fallback)",
      };
    }
  }

  /**
   * Generate greeting audio from text (TTS only, no STT)
   * Uses cache to avoid regenerating same messages
   * @param text - The text to convert to speech
   * @param agentType - Optional agent type for voice optimization (cart, booking, rider)
   * @param voiceId - Optional explicit voice ID (overrides agent default)
   */
  async generateGreeting(
    text: string,
    agentType?: string,
    voiceId?: string
  ): Promise<Blob> {
    // Check cache first
    const cacheKey = `${text.toLowerCase().trim()}:${voiceId || "default"}`;
    if (this.audioCache.has(cacheKey)) {
      console.log("🎵 Audio cache HIT for:", text.substring(0, 50));
      return this.audioCache.get(cacheKey)!;
    }

    console.log("🎵 Audio cache MISS - generating for:", text.substring(0, 50));

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/generate-greeting`,
          { text, agentType, voiceId }, // Pass voiceId to backend
          { responseType: "blob" }
        )
      );

      // Store in cache
      this.audioCache.set(cacheKey, response);

      return response;
    } catch (error) {
      console.warn("Backend voice service unavailable, skipping audio.");
      return new Blob();
    }
  }

  /**
   * Helper to play a blob audio
   */
  playAudioBlob(blob: Blob): HTMLAudioElement {
    if (blob.size === 0) {
      // Handle empty blob (fallback case): Return dummy audio and trigger ended event
      const audio = new Audio();
      // Simulate playback finishing immediately so UI states (like isPlaying) reset
      setTimeout(() => {
        audio.dispatchEvent(new Event("ended"));
      }, 100);
      return audio;
    }

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch((e) => console.warn("Audio play failed:", e));
    return audio;
  }

  /**
   * Clear audio cache (useful for memory management)
   */
  clearCache(): void {
    this.audioCache.clear();
    console.log("🗑️ Audio cache cleared");
  }

  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.audioCache.size;
  }
  /**
   * Browser-based Speech Recognition (Web Speech API)
   * This provides real STT for the demo without backend dependencies.
   */
  listen(): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        reject("Speech Recognition not supported in this browser.");
        return;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.lang = "es-ES"; // Default to Spanish as per user context
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        reject(event.error);
      };

      this.recognition.onend = () => {
        // Automatically stop specific instance logic if needed
      };

      this.recognition.start();
    });
  }

  /**
   * Stop any active browser recognition
   */
  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // ... existing methods ...
}

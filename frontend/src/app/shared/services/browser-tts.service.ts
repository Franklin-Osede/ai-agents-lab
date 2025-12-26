import { Injectable, signal } from "@angular/core";

/**
 * Browser TTS Service
 * Provides fast, free text-to-speech using the browser's built-in speech synthesis API
 *
 * Advantages:
 * - Instant response (50-200ms vs 1200ms with OpenAI)
 * - No backend calls required
 * - Free (no API costs)
 * - Works offline
 *
 * Usage:
 * ```typescript
 * constructor(private browserTTS: BrowserTTSService) {}
 *
 * speak() {
 *   this.browserTTS.speak('¡Hola! Bienvenido', {
 *     onStart: () => this.isSpeaking.set(true),
 *     onEnd: () => this.isSpeaking.set(false)
 *   });
 * }
 * ```
 */
@Injectable({ providedIn: "root" })
export class BrowserTTSService {
  private voicesLoaded = signal<boolean>(false);
  private availableVoices = signal<SpeechSynthesisVoice[]>([]);
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.loadVoices();
  }

  /**
   * Load available voices from the browser
   * Voices load asynchronously in Chrome, synchronously in Safari
   */
  private loadVoices(): void {
    const loadVoicesHandler = () => {
      const voices = window.speechSynthesis.getVoices();
      this.availableVoices.set(voices);
      this.voicesLoaded.set(true);
      console.log(`🎙️ Loaded ${voices.length} voices`);
    };

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoicesHandler;
    }

    // Safari loads voices synchronously
    loadVoicesHandler();
  }

  /**
   * Get the best Spanish voice available
   * Prioritizes Google > Apple > Microsoft > Any Spanish
   */
  getBestSpanishVoice(): SpeechSynthesisVoice | null {
    const voices = this.availableVoices();

    // Priority order for Spanish voices
    const priorities = [
      // 1. Google Spanish voices (best quality)
      (v: SpeechSynthesisVoice) =>
        v.lang.includes("es-ES") && v.name.includes("Google"),

      // 2. Apple Spanish voices (Monica, Jorge, Paulina)
      (v: SpeechSynthesisVoice) =>
        v.lang.includes("es-ES") &&
        (v.name.includes("Monica") ||
          v.name.includes("Jorge") ||
          v.name.includes("Paulina")),

      // 3. Microsoft Spanish voices
      (v: SpeechSynthesisVoice) =>
        v.lang.includes("es-ES") && v.name.includes("Microsoft"),

      // 4. Any es-ES voice
      (v: SpeechSynthesisVoice) => v.lang.includes("es-ES"),

      // 5. Any Spanish variant (es-MX, es-AR, etc.)
      (v: SpeechSynthesisVoice) => v.lang.includes("es"),
    ];

    for (const priorityFn of priorities) {
      const voice = voices.find(priorityFn);
      if (voice) {
        console.log("🎙️ Selected voice:", voice.name, voice.lang);
        return voice;
      }
    }

    console.warn("⚠️ No Spanish voice found, using default");
    return null;
  }

  /**
   * Speak text using browser TTS
   *
   * @param text - The text to speak
   * @param options - Speech options and callbacks
   *
   * @example
   * ```typescript
   * this.browserTTS.speak('¡Hola!', {
   *   rate: 1.0,
   *   pitch: 1.0,
   *   onStart: () => console.log('Started'),
   *   onEnd: () => console.log('Finished')
   * });
   * ```
   */
  speak(
    text: string,
    options: {
      rate?: number; // 0.1-10 (1 = normal speed)
      pitch?: number; // 0-2 (1 = normal pitch)
      volume?: number; // 0-1 (1 = max volume)
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: any) => void;
    } = {}
  ): void {
    if (!this.isSupported()) {
      console.warn("⚠️ Browser TTS not supported");
      options.onError?.("Browser TTS not supported");
      return;
    }

    // Stop any current speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";

    // Select best available Spanish voice
    const voice = this.getBestSpanishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    // Apply speech parameters
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // Event handlers
    utterance.onstart = () => {
      console.log("🎙️ Speech started:", text.substring(0, 50));
      options.onStart?.();
    };

    utterance.onend = () => {
      console.log("🎙️ Speech ended");
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error("🎙️ Speech error:", event);
      this.currentUtterance = null;
      options.onError?.(event);
    };

    // Store current utterance
    this.currentUtterance = utterance;

    // Speak
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop current speech immediately
   */
  stop(): void {
    if (this.currentUtterance) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.currentUtterance && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.currentUtterance && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Check if speech is currently playing
   */
  isSpeaking(): boolean {
    return window.speechSynthesis.speaking;
  }

  /**
   * Check if browser supports speech synthesis
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /**
   * Get all available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices();
  }

  /**
   * Get all Spanish voices
   */
  getSpanishVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices().filter((v) => v.lang.includes("es"));
  }
}

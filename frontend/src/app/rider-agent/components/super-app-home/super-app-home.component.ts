import {
  Component,
  Input,
  Output,
  EventEmitter,
  booleanAttribute,
  signal,
  OnInit,
  OnDestroy,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { VoiceService } from "../../../shared/services/voice.service";
import { UserSessionService } from "../../services/user-session.service";

@Component({
  selector: "app-super-app-home",
  templateUrl: "./super-app-home.component.html",
  styleUrls: [], // No separate style file used as Tailwind is used in HTML
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class SuperAppHomeComponent implements OnInit, OnDestroy {
  @Input({ transform: booleanAttribute }) dialog = false;
  @Output() modalClose = new EventEmitter<void>();

  currentTime = signal<string>("9:41");
  isListening = signal(false);
  isProcessing = signal(false);
  isAgentSpeaking = signal(false); // New state for Agent animation
  searchResults = signal<any[]>([]);
  searchQuery = signal("");

  recentReviews = signal([
    {
      id: "2",
      type: "Japanese",
      restaurant: "Sushi Master",
      image:
        "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop",
      user: "Alice",
      rating: 5,
      comment: "Best sushi in town! 🍣",
      time: "2m ago",
    },
    {
      id: "5",
      type: "Fast Food",
      restaurant: "Burger King",
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop",
      user: "John",
      rating: 4,
      comment: "Great deal on the Whopper.",
      time: "15m ago",
    },
    {
      id: "1",
      type: "Italian",
      restaurant: "Bella Pizza",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop",
      user: "Maria",
      rating: 5,
      comment: "Authentic Italian taste!",
      time: "1h ago",
    },
  ]);

  // Cart Logic
  cart = signal<any[]>([]);
  cartTotal = signal(0);

  addToCart(item: any) {
    this.cart.update((items) => [...items, item]);
    this.cartTotal.update((total) => total + (item.price || 12.99));
    // Optional: Visual feedback
  }

  goToCheckout() {
    this.router.navigate(["/rider/checkout"]);
  }

  private timeInterval: any;
  private greetingTimeout: any;
  private router = inject(Router);
  private voiceService = inject(VoiceService);
  private http = inject(HttpClient);
  public session = inject(UserSessionService);

  // ... (existing helper methods)

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 60000);

    // Play greeting after a short delay (only once per session)
    if (!this.session.homeGreetingPlayed) {
      this.greetingTimeout = setTimeout(() => {
        // Double check inside timeout in case user navigated away
        if (!this.session.homeGreetingPlayed) {
          this.playGreeting();
          this.session.homeGreetingPlayed = true;
        }
      }, 1000);
    }
  }

  playGreeting() {
    if ("speechSynthesis" in window) {
      const user = this.session.user();
      const userName = user?.name || "Amigo";
      const greeting = user?.gender === "female" ? "bienvenida" : "bienvenido";

      const text = `Hola ${userName}, ${greeting}! ¿Qué te apetece comer hoy?`;

      // Stop any existing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Try to select a Spanish voice
      const voices = window.speechSynthesis.getVoices();
      // Prefer premium/Google voices if available, falling back to any 'es' voice
      const spanishVoice = voices.find(
        (v) =>
          v.lang.includes("es") &&
          (v.name.includes("Google") ||
            v.name.includes("Monica") ||
            v.name.includes("Paulina"))
      );
      if (spanishVoice) utterance.voice = spanishVoice;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Animation control
      utterance.onstart = () => this.isAgentSpeaking.set(true);
      utterance.onend = () => this.isAgentSpeaking.set(false);

      window.speechSynthesis.speak(utterance);
    }
  }

  async toggleRecording() {
    if (this.isListening()) {
      this.isListening.set(false);
      this.voiceService.stopListening();
    } else {
      this.isListening.set(true);
      this.searchResults.set([]);

      try {
        // Use Browser's Native Speech Recognition (Real STT)
        // This ensures "Chicken" -> "Chicken" text -> Chicken Results
        const transcript = await this.voiceService.listen();

        this.isListening.set(false);
        if (transcript) {
          this.searchQuery.set(transcript);
          // Pass the transcript directly to ensure immediate execution
          this.submitTextQuery(transcript);
        }
      } catch (error) {
        console.error("Error recognizing speech:", error);
        this.isListening.set(false);
      }
    }
  }

  // Handle Text/Voice Submission
  // overrideQuery allows voice logic to reuse this method
  async submitTextQuery(overrideQuery?: string) {
    const rawInput = this.searchQuery().trim();
    if (!rawInput && !overrideQuery) return;

    this.isProcessing.set(true);
    // Use override if provided (voice), else input (text)
    const query = (overrideQuery || rawInput).toLowerCase();

    // Navigate to Chat with the query as context
    // This allows the Chat Agent (AiMenuChat) to start with this intent
    this.router.navigate(["/rider/chat"], {
      state: {
        data: {
          name: "Rider Agent",
          type: query, // 'italian', 'burger', etc.
        },
      },
    });

    // We don't need the local results logic anymore as the Chat Agent takes over
    this.isProcessing.set(false);
    this.searchQuery.set("");
  }

  selectResult(result: any) {
    if (result.type === "Japanese") {
      this.submitTextQuery("choose_cuisine_japanese");
    } else if (result.type === "Italian") {
      this.submitTextQuery("choose_cuisine_italian");
    } else if (result.type === "Fast Food") {
      this.submitTextQuery("choose_cuisine_fast_food");
    } else {
      // Specific item? For now just generic chat
      this.submitTextQuery(result.name);
    }
  }

  searchAgent() {
    this.submitTextQuery();
  }

  logout() {
    this.session.logout();
    this.router.navigate(["/rider/onboarding"]);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    if (this.greetingTimeout) {
      clearTimeout(this.greetingTimeout);
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  updateTime() {
    const now = new Date();
    this.currentTime.set(
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }

  onBack(event?: Event) {
    if (this.dialog) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.modalClose.emit();
    } else {
      // ... default back logic if needed or just nothing
    }
  }
}

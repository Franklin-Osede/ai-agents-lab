import {
  Component,
  signal,
  inject,
  Input,
  booleanAttribute,
  Output,
  EventEmitter,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { VoiceService } from "../../../shared/services/voice.service";
import { BrowserTTSService } from "../../../shared/services/browser-tts.service";
import { AgentOrchestratorService } from "../../../shared/services/agent-orchestrator.service";
import { AbandonedCartAgentService } from "../../services/abandoned-cart-agent.service";
import { AbandonedCartService } from "../../services/abandoned-cart.service";
import { CartMetrics } from "../../models/cart.model";

@Component({
  selector: "app-welcome-chat",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex items-center justify-center min-h-screen w-full">
      <!-- iPhone-style Container -->
      <div
        class="relative w-full max-w-[390px] h-[844px] bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-[6px] border-white/50 ring-1 ring-slate-900/5"
      >
        <!-- Status Bar -->
        <div
          class="h-14 w-full relative z-50 flex justify-between items-end px-7 pb-3 bg-transparent"
        >
          <span
            class="text-[13px] font-semibold text-slate-900 tracking-tight"
            >{{ currentTime() }}</span
          >
          <div class="flex gap-1.5 items-center pb-0.5">
            <span class="material-symbols-outlined text-[18px] text-slate-900"
              >signal_cellular_alt</span
            >
            <span class="material-symbols-outlined text-[18px] text-slate-900"
              >wifi</span
            >
            <span
              class="material-symbols-outlined text-[20px] text-slate-900 -rotate-90"
              >battery_full</span
            >
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col relative z-10 bg-transparent">
          <!-- Back Button -->
          <div class="px-6 pt-2 pb-4">
            <a
              [routerLink]="null"
              (click)="handleBack($event)"
              class="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors group cursor-pointer"
            >
              <span
                class="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform"
                >arrow_back</span
              >
              <span class="text-sm font-medium">Volver a Agentes</span>
            </a>
          </div>

          <!-- Agent Avatar & Header -->
          <div
            class="flex flex-col items-center justify-center pt-4 pb-10 px-6"
          >
            <div class="relative mb-8">
              <!-- Pulsing Rings (when speaking) -->
              @if (isAgentSpeaking()) {
              <div
                class="absolute inset-0 rounded-full border border-blue-200/60 scale-150 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"
              ></div>
              <div
                class="absolute inset-0 rounded-full border border-blue-100 scale-125 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] animation-delay-500"
              ></div>
              }

              <!-- Avatar Container -->
              <div
                class="relative w-32 h-32 rounded-full bg-white shadow-glow-blue flex items-center justify-center p-1.5"
              >
                <div
                  class="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-300/20 animate-spin-slow"
                ></div>
                <div
                  class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-inner overflow-hidden relative"
                >
                  <div
                    class="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-12 transform origin-bottom-left"
                  ></div>
                  <span
                    class="material-symbols-outlined text-5xl text-white relative z-10 drop-shadow-md"
                  >
                    {{ isAgentSpeaking() ? "graphic_eq" : "shopping_cart" }}
                  </span>
                </div>
                <!-- Online Indicator -->
                <div
                  class="absolute top-1 right-2 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full shadow-sm z-20"
                ></div>
              </div>
            </div>

            <h1 class="text-2xl font-bold text-slate-800 tracking-tight mb-1">
              Agente Recuperador IA
            </h1>
            <p class="text-blue-500/90 text-sm font-medium tracking-wide">
              Tu experto en recuperación de ventas
            </p>
          </div>

          <!-- Welcome Message Card -->
          <div class="flex-1 px-6 flex flex-col">
            <div
              class="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-card-soft border border-slate-100 mb-6"
            >
              <div class="flex items-start gap-4 mb-4">
                <div class="flex-shrink-0">
                  <div
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"
                  >
                    <span class="material-symbols-outlined text-white text-xl">
                      waving_hand
                    </span>
                  </div>
                </div>
                <div class="flex-1">
                  <h2 class="text-lg font-bold text-slate-800 mb-2">
                    ¡Hola! 👋
                  </h2>
                  <p class="text-slate-600 text-sm leading-relaxed">
                    Soy tu <strong>Agente Recuperador de Carritos</strong>. Dale
                    a continuar y podrás
                    <strong>maximizar las ventas</strong> de usuarios que
                    dejaron items en el carrito.
                  </p>
                </div>
              </div>

              <!-- Audio Indicator (when playing) -->
              @if (isAgentSpeaking()) {
              <div
                class="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4"
              >
                <span class="flex h-2 w-2 relative">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"
                  ></span>
                  <span
                    class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"
                  ></span>
                </span>
                <span class="text-xs text-blue-600 font-medium"
                  >Reproduciendo mensaje...</span
                >
              </div>
              }

              <!-- Stats Preview (Optional) -->
              @if (metrics()) {
              <div
                class="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 rounded-lg"
              >
                <div class="text-center">
                  <div class="text-xl font-bold text-blue-600">
                    {{ metrics()?.abandonedToday || 0 }}
                  </div>
                  <div class="text-[10px] text-slate-500">Hoy</div>
                </div>
                <div class="text-center border-l border-r border-slate-200">
                  <div class="text-xl font-bold text-blue-600">
                    €{{ (metrics()?.totalValue || 0).toFixed(0) }}
                  </div>
                  <div class="text-[10px] text-slate-500">Valor</div>
                </div>
                <div class="text-center">
                  <div class="text-xl font-bold text-green-600">
                    {{ (metrics()?.recoveryRate || 0).toFixed(0) }}%
                  </div>
                  <div class="text-[10px] text-slate-500">Recuperación</div>
                </div>
              </div>
              }

              <!-- Continue Button -->
              <button
                (click)="goToDashboard()"
                class="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] transform"
              >
                <span>Continuar al Dashboard</span>
                <span
                  class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform"
                  >arrow_forward</span
                >
              </button>
            </div>
          </div>
        </div>

        <!-- Home Indicator -->
        <div
          class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-200 rounded-full z-50"
        ></div>
      </div>
    </div>
  `,
  styles: [
    `
      .animation-delay-500 {
        animation-delay: 0.5s;
      }

      .animate-spin-slow {
        animation: spin 10s linear infinite;
      }

      .shadow-glow-blue {
        box-shadow: 0 0 30px -5px rgba(59, 130, 246, 0.4);
      }

      .shadow-card-soft {
        box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
      }
    `,
  ],
})
export class WelcomeChatComponent implements OnDestroy {
  private voiceService = inject(VoiceService);
  private browserTTS = inject(BrowserTTSService);
  private router = inject(Router);
  private orchestrator = inject(AgentOrchestratorService);
  private cartAgent = inject(AbandonedCartAgentService);
  private cartService = inject(AbandonedCartService);

  // State signals
  currentTime = signal<string>("9:41");
  metrics = signal<CartMetrics | null>(null);
  isAgentSpeaking = signal<boolean>(false);

  // Audio
  private greetingAudio: HTMLAudioElement | null = null;

  // New input for modal mode
  isDialog = signal<boolean>(false);
  @Input({ transform: booleanAttribute })
  set dialog(value: boolean) {
    this.isDialog.set(value);
  }

  @Output() modalClose = new EventEmitter<void>();

  handleBack(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isDialog()) {
      this.modalClose.emit();
      return;
    }

    // Agent Orchestrator Logic
    const history = this.orchestrator.getDebugInfo().navigationHistory;
    if (history.length > 0) {
      this.orchestrator.goBack();
      const active = this.orchestrator.activeAgent();
      if (active === "rider") {
        this.router.navigate(["/rider/chat"]);
      } else {
        this.router.navigate(["/"]);
      }
    } else {
      // Default fallback
      this.router.navigate(["/"]);
    }
  }

  constructor() {
    // Update time
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);

    // Activate the abandoned cart agent
    this.orchestrator.activateAgent("abandoned-cart");

    // Load metrics for preview (optional)
    this.loadMetrics();

    // Play automatic greeting immediately (no delay)
    this.playGreeting();
  }

  updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    this.currentTime.set(`${hours}:${minutes}`);
  }

  /**
   * Play automatic greeting using Browser TTS (instant response)
   * Migrated from OpenAI TTS for 93% faster response (2200ms → 150ms)
   */
  private playGreeting() {
    if (!this.browserTTS.isSupported()) {
      console.warn("⚠️ Browser TTS not supported");
      return;
    }

    const greetingText =
      "¡Hola! Soy tu Agente Recuperador de Carritos. Dale a continuar y podrás maximizar las ventas de usuarios que dejaron items en el carrito.";

    this.browserTTS.speak(greetingText, {
      rate: 1.0,
      pitch: 1.0,
      onStart: () => {
        this.isAgentSpeaking.set(true);
      },
      onEnd: () => {
        this.isAgentSpeaking.set(false);
      },
      onError: (error) => {
        console.error("Error playing greeting:", error);
        this.isAgentSpeaking.set(false);
      },
    });
  }

  /**
   * Load metrics for stats preview
   */
  private loadMetrics(): void {
    this.cartService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
      },
      error: (err) => {
        console.error("Failed to load metrics:", err);
        // Set mock data for preview
        this.metrics.set({
          abandonedToday: 19,
          totalValue: 1240,
          recoveryRate: 23,
          recoveredRevenue: 285,
        });
      },
    });
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(["/abandoned-cart/dashboard"]);
  }

  /**
   * Cleanup when component is destroyed
   */
  ngOnDestroy(): void {
    // Stop Browser TTS speech
    this.browserTTS.stop();
    this.isAgentSpeaking.set(false);
  }
}

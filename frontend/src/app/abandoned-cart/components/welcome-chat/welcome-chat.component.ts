import {
  Component,
  signal,
  inject,
  Input,
  booleanAttribute,
  Output,
  EventEmitter,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { VoiceService } from "../../../shared/services/voice.service";
import { AgentOrchestratorService } from "../../../shared/services/agent-orchestrator.service";

@Component({
  selector: "app-welcome-chat",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      [ngClass]="{
        'flex items-center justify-center min-h-screen p-4 sm:p-8 bg-slate-200':
          !isDialog(),
        'flex items-center justify-center h-full w-full': isDialog()
      }"
    >
      <!-- iPhone-style Container -->
      <div
        class="relative w-full max-w-[390px] h-[844px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-[6px] border-slate-50 ring-1 ring-slate-900/5"
      >
        <!-- Background Blobs -->
        <div
          class="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50 to-white z-0"
        ></div>
        <div
          class="absolute -top-12 -right-12 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
        ></div>
        <div
          class="absolute top-12 -left-12 w-64 h-64 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"
        ></div>

        <!-- Status Bar -->
        <div
          class="h-14 w-full relative z-50 flex justify-between items-end px-7 pb-3"
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
        <div class="flex-1 flex flex-col relative z-10">
          <!-- Back Button -->
          <div class="px-6 pt-2 pb-4">
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
          </div>

          <!-- Agent Avatar & Header -->
          <div
            class="flex flex-col items-center justify-center pt-4 pb-10 px-6"
          >
            <div class="relative mb-8">
              <!-- Pulsing Rings -->
              @if (isAgentSpeaking()) {
              <div
                class="absolute inset-0 rounded-full border border-blue-200/60 scale-150 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"
              ></div>
              } @if (isAgentSpeaking()) {
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

          <!-- Chat Area -->
          <div class="flex-1 px-6 flex flex-col justify-start">
            <!-- Greeting Audio Card -->
            @if (step() >= 1) {
            <div
              class="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-card-soft border border-white/50 mb-auto mt-4"
            >
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2">
                  @if (isPlayingGreeting()) {
                  <span class="flex h-2 w-2 relative">
                    <span
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"
                    ></span>
                    <span
                      class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"
                    ></span>
                  </span>
                  }
                  <span
                    class="text-[11px] font-bold text-slate-400 uppercase tracking-widest"
                    >Saludo</span
                  >
                </div>
                <span class="text-xs font-medium text-slate-400 font-mono"
                  >0:05</span
                >
              </div>
              <div class="flex items-center gap-4">
                <!-- Play Button -->
                <button
                  (click)="playGreeting()"
                  [disabled]="isPlayingGreeting()"
                  class="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors duration-300 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
                >
                  <span
                    class="material-symbols-outlined text-2xl ml-0.5 group-hover:scale-110 transition-transform"
                  >
                    {{ isPlayingGreeting() ? "pause" : "play_arrow" }}
                  </span>
                </button>
                <!-- Waveform Visualization -->
                <div
                  class="flex-1 h-8 flex items-center justify-between gap-[2px] opacity-80"
                >
                  <div
                    class="w-1 bg-blue-500 rounded-full h-3"
                    [class.animate-pulse]="isPlayingGreeting()"
                  ></div>
                  <div
                    class="w-1 bg-blue-500 rounded-full h-5"
                    [class.animate-pulse]="isPlayingGreeting()"
                  ></div>
                  <div
                    class="w-1 bg-blue-500 rounded-full h-8"
                    [class.animate-pulse]="isPlayingGreeting()"
                  ></div>
                  <div class="w-1 bg-blue-400 rounded-full h-4"></div>
                  <div class="w-1 bg-blue-300 rounded-full h-6"></div>
                  <div class="w-1 bg-slate-200 rounded-full h-7"></div>
                  <div class="w-1 bg-slate-200 rounded-full h-4"></div>
                  <div class="w-1 bg-slate-200 rounded-full h-2"></div>
                  <div class="w-1 bg-slate-200 rounded-full h-5"></div>
                  <div class="w-1 bg-slate-200 rounded-full h-3"></div>
                  <div class="w-1 bg-slate-200 rounded-full h-6"></div>
                  <div class="w-1 bg-slate-200 rounded-full h-4"></div>
                  <div class="w-1 bg-slate-200 rounded-full h-2"></div>
                  <div class="w-1 bg-slate-200 rounded-full h-3"></div>
                </div>
              </div>
            </div>
            }

            <!-- User Response Card (after recording) -->
            @if (step() >= 2) {
            <div
              class="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-card-soft border border-white/50 mt-4"
            >
              <div class="flex justify-between items-center mb-3">
                <div class="flex items-center gap-2">
                  <span
                    class="text-[11px] font-bold text-blue-500 uppercase tracking-widest"
                    >Tu respuesta</span
                  >
                </div>
              </div>
              <p class="text-sm text-slate-700">
                {{ userTranscript() || "Procesando..." }}
              </p>
            </div>
            }

            <!-- AI Response Card -->
            @if (step() >= 3) {
            <div
              class="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-card-soft border border-white/50 mt-4 animate-in fade-in slide-in-from-bottom-4"
            >
              <div class="flex justify-between items-center mb-3">
                <div class="flex items-center gap-2">
                  @if (isAgentSpeaking()) {
                  <span class="flex h-2 w-2 relative">
                    <span
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"
                    ></span>
                    <span
                      class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"
                    ></span>
                  </span>
                  }
                  <span
                    class="text-[11px] font-bold text-slate-400 uppercase tracking-widest"
                    >Respuesta IA</span
                  >
                </div>
                <button
                  (click)="replayResponse()"
                  [disabled]="isAgentSpeaking()"
                  class="text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="material-symbols-outlined text-lg">replay</span>
                </button>
              </div>
              <p class="text-sm text-slate-700">
                {{ aiTranscript() || "Generando respuesta..." }}
              </p>
            </div>
            }

            <!-- Microphone Button Area -->
            <div class="flex flex-col items-center pb-12 mt-auto">
              <!-- Ready to Record -->
              @if (step() === 1) {
              <div class="flex flex-col items-center">
                <p
                  class="text-slate-400 text-sm font-medium mb-8 animate-pulse"
                >
                  Presiona para responder
                </p>
                <button
                  (click)="startRecording()"
                  class="group relative w-24 h-24 focus:outline-none touch-manipulation"
                >
                  <!-- Hover Ripples -->
                  <div
                    class="absolute inset-0 bg-blue-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-125 transform"
                  ></div>
                  <div
                    class="absolute inset-0 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-75 group-hover:scale-150 transform"
                  ></div>
                  <!-- Button -->
                  <div
                    class="relative w-full h-full rounded-full bg-gradient-to-b from-blue-500 to-blue-700 shadow-button-float flex items-center justify-center transition-all duration-200 group-active:scale-95 group-active:shadow-inner border border-blue-400/30"
                  >
                    <div
                      class="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none"
                    ></div>
                    <span
                      class="material-symbols-outlined text-4xl text-white drop-shadow-sm"
                      >mic</span
                    >
                  </div>
                </button>
              </div>
              }

              <!-- Recording State -->
              @if (step() === 1.5) {
              <div class="flex flex-col items-center animate-in fade-in">
                <div class="flex gap-1 mb-6 h-8 items-center">
                  <div
                    class="w-1.5 bg-red-500 rounded-full animate-[music-bar_0.5s_ease-in-out_infinite]"
                    style="height: 40%"
                  ></div>
                  <div
                    class="w-1.5 bg-red-500 rounded-full animate-[music-bar_0.7s_ease-in-out_infinite]"
                    style="height: 80%"
                  ></div>
                  <div
                    class="w-1.5 bg-red-500 rounded-full animate-[music-bar_0.6s_ease-in-out_infinite]"
                    style="height: 100%"
                  ></div>
                  <div
                    class="w-1.5 bg-red-500 rounded-full animate-[music-bar_0.8s_ease-in-out_infinite]"
                    style="height: 60%"
                  ></div>
                  <div
                    class="w-1.5 bg-red-500 rounded-full animate-[music-bar_0.5s_ease-in-out_infinite]"
                    style="height: 40%"
                  ></div>
                </div>
                <button
                  (click)="stopRecording()"
                  class="px-8 py-3 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition shadow-lg"
                >
                  Detener Grabación
                </button>
              </div>
              }

              <!-- Processing State -->
              @if (step() === 2) {
              <div class="flex flex-col items-center animate-in fade-in">
                <span
                  class="material-symbols-outlined animate-spin text-blue-500 text-3xl mb-3"
                  >sync</span
                >
                <p class="text-sm text-slate-400 font-medium">
                  Procesando tu voz...
                </p>
              </div>
              }

              <!-- Completed - Dashboard Button -->
              @if (step() >= 3) {
              <div
                class="w-full px-6 animate-in slide-in-from-bottom-4 duration-500"
              >
                <a
                  routerLink="dashboard"
                  class="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-button-float hover:shadow-glow-blue active:scale-[0.98]"
                >
                  <span>Ir al Dashboard</span>
                  <span
                    class="material-symbols-outlined group-hover:translate-x-1 transition-transform"
                    >arrow_forward</span
                  >
                </a>
              </div>
              }
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
      @keyframes music-bar {
        0%,
        100% {
          height: 40%;
        }
        50% {
          height: 100%;
        }
      }

      @keyframes blob {
        0% {
          transform: translate(0px, 0px) scale(1);
        }
        33% {
          transform: translate(30px, -50px) scale(1.1);
        }
        66% {
          transform: translate(-20px, 20px) scale(0.9);
        }
        100% {
          transform: translate(0px, 0px) scale(1);
        }
      }

      .animate-blob {
        animation: blob 7s infinite;
      }

      .animation-delay-2000 {
        animation-delay: 2s;
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

      .shadow-button-float {
        box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.3);
      }
    `,
  ],
})
export class WelcomeChatComponent {
  private voiceService = inject(VoiceService);
  private router = inject(Router);
  private orchestrator = inject(AgentOrchestratorService);

  step = signal<number>(1); // 1: Initial, 1.5: Recording, 2: Processing, 3: Completed
  isAgentSpeaking = signal<boolean>(false);
  isPlayingGreeting = signal<boolean>(false);

  userTranscript = signal<string>("");
  aiTranscript = signal<string>("");
  currentTime = signal<string>("9:41");

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

  private responseAudioBlob: Blob | null = null;
  private greetingAudio: HTMLAudioElement | null = null;
  private responseAudio: HTMLAudioElement | null = null;

  constructor() {
    // Update time
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);

    // Removed autoplay - user controls when to play greeting
  }

  updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    this.currentTime.set(`${hours}:${minutes}`);
  }

  async playGreeting() {
    // Prevent double playback
    if (this.isPlayingGreeting()) {
      return;
    }

    try {
      this.isPlayingGreeting.set(true);
      this.isAgentSpeaking.set(true);

      // Generate greeting audio if not already generated
      if (!this.greetingAudio) {
        const greetingText =
          "¡Hola! ¡Qué alegría verte por aquí! Soy tu Agente Recuperador. ¿Te gustaría saber cuántos carritos abandonados tienes pendientes?";
        const audioBuffer = await this.voiceService.generateGreeting(
          greetingText
        );
        this.greetingAudio = this.voiceService.playAudioBlob(audioBuffer);

        this.greetingAudio.onended = () => {
          this.isPlayingGreeting.set(false);
          this.isAgentSpeaking.set(false);
        };
      } else {
        this.greetingAudio.currentTime = 0; // Reset to beginning
        this.greetingAudio.play();
        this.greetingAudio.onended = () => {
          this.isPlayingGreeting.set(false);
          this.isAgentSpeaking.set(false);
        };
      }
    } catch (error) {
      console.error("Error playing greeting:", error);
      this.isPlayingGreeting.set(false);
      this.isAgentSpeaking.set(false);
    }
  }

  async startRecording() {
    try {
      this.step.set(1.5);
      await this.voiceService.startRecording();
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        "No se pudo acceder al micrófono. Por favor, permite el acceso al micrófono."
      );
      this.step.set(1);
    }
  }

  async stopRecording() {
    try {
      const audioBlob = await this.voiceService.stopRecording();
      this.step.set(2); // Processing

      // Improved system prompt for shorter, more focused responses
      const systemPrompt = `Eres un asistente de recuperación de carritos abandonados. 
      Tono: FORMAL, PROFESIONAL, AMABLE Y ALEGRE (muy importante el tono alegre y entusiasta).
      Sé EXTREMADAMENTE BREVE (máximo 2 frases cortas).
      Si el usuario dice SÍ: Responde con entusiasmo "¡Perfecto! Presiona el botón para ver tu dashboard."
      Si el usuario dice NO: Responde amablemente "¡Entendido! ¿En qué más puedo ayudarte?"
      Mantén siempre un tono positivo, alegre y motivador.`;

      // Send to backend
      const result = await this.voiceService.interact(audioBlob, systemPrompt);

      this.userTranscript.set(result.userText);
      this.aiTranscript.set(result.aiText);
      this.responseAudioBlob = result.audio;

      this.step.set(3); // Completed

      // Auto play response
      setTimeout(() => {
        this.replayResponse();
      }, 500);
    } catch (error) {
      console.error("Interaction failed:", error);
      alert("Hubo un error procesando tu voz. Por favor, intenta de nuevo.");
      this.step.set(1); // Reset on error
    }
  }

  replayResponse() {
    // Prevent double playback
    if (this.isAgentSpeaking() || !this.responseAudioBlob) {
      return;
    }

    // Stop previous audio if exists
    if (this.responseAudio) {
      this.responseAudio.pause();
      this.responseAudio.currentTime = 0;
    }

    this.responseAudio = this.voiceService.playAudioBlob(
      this.responseAudioBlob
    );
    this.isAgentSpeaking.set(true);

    this.responseAudio.onended = () => {
      this.isAgentSpeaking.set(false);
    };
  }
}

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from "@angular/core";
import { VoiceService } from "../../../shared/services/voice.service";
import { Router, ActivatedRoute } from "@angular/router";
import { AgentOrchestratorService } from "../../../shared/services/agent-orchestrator.service";

interface VoiceOption {
  label: string;
  value: string;
  icon: string;
}

interface ConversationStep {
  question: string;
  options: VoiceOption[];
  nextStep?: string | ((answer: string) => string);
}

type NicheFlows = Record<string, Record<string, ConversationStep>>;

@Component({
  selector: "app-voice-booking",
  templateUrl: "./voice-booking.component.html",
  styleUrls: ["./voice-booking.component.scss"],
})
export class VoiceBookingComponent implements OnInit, OnDestroy {
  // Signals for reactive state
  currentStep = signal<string>("greeting");
  selectedNiche = signal<string>("dentist");
  isPlayingAudio = signal<boolean>(false);
  conversationHistory = signal<{ question: string; answer: string }[]>([]);
  showCalendar = signal<boolean>(false);

  // Current audio element
  private currentAudio: HTMLAudioElement | null = null;

  // Current time for status bar
  currentTime = signal<string>("");

  // Computed current question
  currentQuestion = computed(() => {
    const flow = this.nicheFlows[this.selectedNiche()];
    return flow?.[this.currentStep()];
  });

  private voiceService = inject(VoiceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private orchestrator = inject(AgentOrchestratorService);

  // Niche-specific conversation flows
  private nicheFlows: NicheFlows = {
    restaurant: {
      greeting: {
        question:
          "¡Hola! Soy tu asistente de reservas. ¿Qué te gustaría hacer hoy?",
        options: [
          {
            label: "Reservar Mesa",
            value: "reserve",
            icon: "table_restaurant",
          },
          {
            label: "Ver Disponibilidad",
            value: "check",
            icon: "calendar_month",
          },
        ],
        nextStep: (answer) =>
          answer === "reserve" ? "party_size" : "calendar",
      },
      party_size: {
        question: "¿Para cuántas personas necesitas la mesa?",
        options: [
          { label: "2 Personas", value: "2", icon: "group" },
          { label: "4 Personas", value: "4", icon: "groups" },
          { label: "Grupo Grande", value: "large", icon: "diversity_3" },
        ],
        nextStep: "time_preference",
      },
      time_preference: {
        question: "¿Prefieres comer o cenar?",
        options: [
          { label: "Comida (Mediodía)", value: "lunch", icon: "wb_sunny" },
          { label: "Cena (Noche)", value: "dinner", icon: "bedtime" },
        ],
        nextStep: "calendar",
      },
    },
    dentist: {
      greeting: {
        question: "Clínica Dental Sonrisas. ¿En qué puedo ayudarte?",
        options: [
          { label: "Agendar Limpieza", value: "cleaning", icon: "dentistry" },
          { label: "Urgencia", value: "emergency", icon: "warning" },
        ],
        nextStep: "calendar",
      },
    },
    medico: {
      greeting: {
        question:
          "Consulta Médica. ¿Tienen disponibilidad esta semana? (Simulado)",
        options: [
          {
            label: "Agendar Cita",
            value: "appointment",
            icon: "medical_services",
          },
          { label: "Urgencia", value: "emergency", icon: "local_hospital" },
        ],
        nextStep: "calendar",
      },
    },
    clinica: {
      greeting: {
        question: "Bienvenido a la Clínica. ¿En qué podemos ayudarte?",
        options: [
          { label: "Cita General", value: "general", icon: "medical_services" },
          { label: "Especialista", value: "specialist", icon: "person_search" },
        ],
        nextStep: "calendar",
      },
    },
    doctor: {
      greeting: {
        question: "Consulta Médica. ¿En qué puedo ayudarte?",
        options: [
          {
            label: "Agendar Cita",
            value: "appointment",
            icon: "medical_services",
          },
          {
            label: "Consultar Especialista",
            value: "specialist",
            icon: "person_search",
          },
        ],
        nextStep: "calendar",
      },
    },
  };

  ngOnInit(): void {
    // Update time
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);

    // Get niche from route params or default to dentist
    this.route.queryParams.subscribe((params) => {
      const niche = params["niche"] || "dentist";
      this.selectedNiche.set(niche);
      this.playCurrentQuestion();
    });
  }

  updateTime(): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    this.currentTime.set(`${hours}:${minutes}`);
  }

  async playCurrentQuestion(): Promise<void> {
    const question = this.currentQuestion();
    if (!question) return;

    try {
      this.isPlayingAudio.set(true);

      // Stop any current audio
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      // Generate and play audio
      const audioBuffer = await this.voiceService.generateGreeting(
        question.question
      );
      this.currentAudio = this.voiceService.playAudioBlob(audioBuffer);

      // Handle audio end
      if (this.currentAudio) {
        this.currentAudio.onended = () => {
          this.isPlayingAudio.set(false);
        };
      }
    } catch (error) {
      console.error("Error playing question:", error);
      this.isPlayingAudio.set(false);
    }
  }

  async selectOption(option: VoiceOption): Promise<void> {
    const question = this.currentQuestion();
    if (!question) return;

    // Add to history
    this.conversationHistory.update((history) => [
      ...history,
      { question: question.question, answer: option.label },
    ]);

    // Determine next step
    const nextStep = question.nextStep;
    if (nextStep === "calendar") {
      this.showCalendar.set(true);
    } else if (nextStep === "end") {
      // End conversation
      this.goBack();
    } else if (typeof nextStep === "function") {
      const next = nextStep(option.value);
      if (next === "calendar") {
        this.showCalendar.set(true);
      } else {
        this.currentStep.set(next);
        await this.playCurrentQuestion();
      }
    } else if (nextStep) {
      this.currentStep.set(nextStep);
      await this.playCurrentQuestion();
    }
  }

  replayQuestion(): void {
    this.playCurrentQuestion();
  }

  goBack(): void {
    // Check orchestrator context/history
    const context = this.orchestrator.getContext();
    const history = this.orchestrator.getDebugInfo().navigationHistory;

    if (context.returnTo === "rider" || history.length > 0) {
      this.orchestrator.goBack();

      const activeAgent = this.orchestrator.activeAgent();
      if (activeAgent === "rider") {
        this.router.navigate(["/rider/chat"]);
      } else {
        this.router.navigate(["/"]);
      }
    } else {
      this.router.navigate(["/"]);
    }
  }

  ngOnDestroy(): void {
    // Cleanup audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { VoiceService } from '../../../shared/services/voice.service';
import { Router, ActivatedRoute } from '@angular/router';

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

type NicheFlows = {
  [niche: string]: {
    [step: string]: ConversationStep;
  };
};

@Component({
  selector: 'app-voice-booking',
  templateUrl: './voice-booking.component.html',
  styleUrls: ['./voice-booking.component.scss'],
})
export class VoiceBookingComponent implements OnInit, OnDestroy {
  // Signals for reactive state
  currentStep = signal<string>('greeting');
  selectedNiche = signal<string>('dentist');
  isPlayingAudio = signal<boolean>(false);
  conversationHistory = signal<Array<{ question: string; answer: string }>>([]);
  showCalendar = signal<boolean>(false);

  // Current audio element
  private currentAudio: HTMLAudioElement | null = null;

  // Current time for status bar
  currentTime = signal<string>('');

  // Computed current question
  currentQuestion = computed(() => {
    const flow = this.nicheFlows[this.selectedNiche()];
    return flow?.[this.currentStep()];
  });

  // Niche-specific conversation flows
  private nicheFlows: NicheFlows = {
    dentist: {
      greeting: {
        question: '¡Buenas tardes! Bienvenido a Clínica Dental Sonrisa. ¿En qué puedo ayudarte hoy?',
        options: [
          { label: 'Agendar cita', value: 'agendar', icon: 'calendar_month' },
          { label: 'Modificar cita', value: 'modificar', icon: 'edit_calendar' },
          { label: 'Cancelar cita', value: 'cancelar', icon: 'cancel' },
        ],
        nextStep: (answer) => answer === 'agendar' ? 'consultation_type' : 'end',
      },
      consultation_type: {
        question: '¡Perfecto! ¿Qué tipo de consulta necesitas?',
        options: [
          { label: 'Revisión general', value: 'revision', icon: 'search' },
          { label: 'Limpieza dental', value: 'limpieza', icon: 'cleaning_services' },
          { label: 'Urgencia/Dolor', value: 'urgencia', icon: 'emergency' },
          { label: 'Ortodoncia', value: 'ortodoncia', icon: 'straighten' },
        ],
        nextStep: (answer) => answer === 'urgencia' ? 'pain_type' : 'calendar',
      },
      pain_type: {
        question: 'Entiendo, es urgente. ¿Qué tipo de molestia tienes?',
        options: [
          { label: 'Dolor intenso', value: 'dolor', icon: 'sentiment_very_dissatisfied' },
          { label: 'Sangrado', value: 'sangrado', icon: 'water_drop' },
          { label: 'Diente roto', value: 'roto', icon: 'broken_image' },
        ],
        nextStep: 'calendar',
      },
    },
    doctor: {
      greeting: {
        question: '¡Buenas tardes! Bienvenido al Centro Médico Salud Plus. ¿Cómo puedo ayudarte?',
        options: [
          { label: 'Agendar consulta', value: 'agendar', icon: 'medical_services' },
          { label: 'Modificar cita', value: 'modificar', icon: 'edit_calendar' },
          { label: 'Cancelar cita', value: 'cancelar', icon: 'cancel' },
        ],
        nextStep: (answer) => answer === 'agendar' ? 'specialty' : 'end',
      },
      specialty: {
        question: '¡Claro! ¿Qué especialidad necesitas?',
        options: [
          { label: 'Medicina General', value: 'general', icon: 'local_hospital' },
          { label: 'Cardiología', value: 'cardio', icon: 'favorite' },
          { label: 'Traumatología', value: 'trauma', icon: 'healing' },
          { label: 'Pediatría', value: 'pediatria', icon: 'child_care' },
        ],
        nextStep: 'visit_type',
      },
      visit_type: {
        question: 'Perfecto. ¿Es primera consulta o seguimiento?',
        options: [
          { label: 'Primera vez', value: 'primera', icon: 'new_releases' },
          { label: 'Seguimiento', value: 'seguimiento', icon: 'assignment' },
          { label: 'Urgente', value: 'urgente', icon: 'emergency' },
        ],
        nextStep: 'symptoms',
      },
      symptoms: {
        question: 'Entendido. ¿Tienes algún síntoma específico?',
        options: [
          { label: 'Fiebre/Gripe', value: 'fiebre', icon: 'thermostat' },
          { label: 'Necesito receta', value: 'receta', icon: 'medication' },
          { label: 'Chequeo preventivo', value: 'chequeo', icon: 'health_and_safety' },
          { label: 'Otro motivo', value: 'otro', icon: 'help' },
        ],
        nextStep: 'calendar',
      },
    },
  };

  constructor(
    private voiceService: VoiceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Update time
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);

    // Get niche from route params or default to dentist
    this.route.queryParams.subscribe(params => {
      const niche = params['niche'] || 'dentist';
      this.selectedNiche.set(niche);
      this.playCurrentQuestion();
    });
  }

  updateTime(): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
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
      const audioBuffer = await this.voiceService.generateGreeting(question.question);
      this.currentAudio = this.voiceService.playAudioBlob(audioBuffer);

      // Handle audio end
      if (this.currentAudio) {
        this.currentAudio.onended = () => {
          this.isPlayingAudio.set(false);
        };
      }
    } catch (error) {
      console.error('Error playing question:', error);
      this.isPlayingAudio.set(false);
    }
  }

  async selectOption(option: VoiceOption): Promise<void> {
    const question = this.currentQuestion();
    if (!question) return;

    // Add to history
    this.conversationHistory.update(history => [
      ...history,
      { question: question.question, answer: option.label },
    ]);

    // Determine next step
    const nextStep = question.nextStep;
    if (nextStep === 'calendar') {
      this.showCalendar.set(true);
    } else if (nextStep === 'end') {
      // End conversation
      this.goBack();
    } else if (typeof nextStep === 'function') {
      const next = nextStep(option.value);
      if (next === 'calendar') {
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
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    // Cleanup audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}

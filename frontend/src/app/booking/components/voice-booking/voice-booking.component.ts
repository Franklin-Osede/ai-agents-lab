import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
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

type NicheFlows = Record<string, Record<string, ConversationStep>>;

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
  conversationHistory = signal<{ question: string; answer: string }[]>([]);
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

  private voiceService = inject(VoiceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Niche-specific conversation flows
  private nicheFlows: NicheFlows = {
    // ... (content remains same)
  };

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

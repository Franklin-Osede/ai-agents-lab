import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceService } from '../../../core/services/voice.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-bubble.component.html',
  styleUrls: ['./chat-bubble.component.scss']
})
export class ChatBubbleComponent implements OnInit {
  private voiceService = inject(VoiceService);
  isChatActive = signal(false);
  isPlaying = signal(false);
  showChips = signal(false);
  
  // Chat History
  messages = signal<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente virtual. ¿Qué tipo de negocio tienes y cómo te puedo solucionar dudas?' }
  ]);

  // Current View of Chips (main vs faqs)
  currentChipView = signal<'main' | 'faqs'>('main');
  
  // Track which chips the user has already asked about
  clickedChips = signal<Set<string>>(new Set());

  // The first AI greeting text
  private greetingDisplay = "¡Hola! Soy tu asistente virtual. Cuéntame, ¿de qué trata tu negocio y en qué te puedo ayudar hoy?";
  private greetingSpeak = "¡Hola! Soy tu asistente virtual. Cuéntame... ¿De qué trata tu negocio y en qué te puedo ayudar hoy?";
  private selectedVoiceId = "Lucia"; // Premium neural spanish female voice from AWS Polly

  ngOnInit() {
    // Optionally preload the greeting audio to reduce latency
    this.voiceService.preload(this.greetingSpeak, this.selectedVoiceId);
  }

  // Open the actual chat interface and trigger voice
  startChat() {
    this.isChatActive.set(true);
    this.playGreeting();
  }

  playGreeting() {
    this.isPlaying.set(true);
    this.showChips.set(false);
    this.voiceService.speak(this.greetingSpeak, this.selectedVoiceId).subscribe({
      next: url => {
        if (url) {
          const audio = new Audio(url);
          audio.onended = () => {
            this.isPlaying.set(false);
            this.showChips.set(true);
          };
          audio.play().catch(e => {
            console.error("Autoplay blocked.", e);
            this.isPlaying.set(false);
            this.showChips.set(true);
          });
        } else {
          this.isPlaying.set(false);
          this.showChips.set(true);
        }
      },
      error: () => {
        this.isPlaying.set(false);
        this.showChips.set(true);
      }
    });
  }

  handleChipClick(chipText: string) {
    // Basic User Message
    this.addMessage('user', chipText);
    this.showChips.set(false); // hide chips while processing/speaking
    
    // Register the clicked chip so it disappears from the options
    this.clickedChips.update(set => {
      const newSet = new Set(set);
      newSet.add(chipText);
      return newSet;
    });

    let responseDisplay = "";
    let responseSpeak = "";
    let nextView: 'main' | 'faqs' = this.currentChipView(); // keep current view unless changing

    // Specific Flow Routing
    if (chipText === "❓ Preguntas Frecuentes") {
      nextView = 'faqs';
      responseDisplay = "Claro, aquí tengo las dudas más habituales. Dime, ¿qué necesitas saber exactamente?";
      responseSpeak = "Claro, aquí tengo las dudas más habituales. Dime... ¿qué necesitas saber exactamente?";
    } else if (chipText === "↩️ Volver a inicio") {
      nextView = 'main';
      responseDisplay = "¿Hay alguna otra cosa en la que pueda ayudarte?";
      responseSpeak = "¿Hay alguna otra cosa en la que pueda ayudarte?";
    } else if (chipText === "¿Cómo funciona su servicio?") {
       responseDisplay = "El proceso es fácil. Primero agendamos una llamada contigo para evaluar tu negocio. Después, te diseñamos un plan de acción exacto para que consigas más clientes, todo de forma automatizada.";
       responseSpeak = "El proceso es fácil. Primero agendamos una llamada contigo para evaluar tu negocio. Y después... te diseñamos un plan de acción exacto para que consigas más clientes, todo de forma automatizada.";
    } else if (chipText === "¿Cuánto tarda la instalación?") {
       responseDisplay = "Suele tardar unas cuatro semanas. En ese tiempo, dejamos tu propio servidor seguro con agentes inteligentes, perfectamente conectados a tu base de datos y listos para trabajar.";
       responseSpeak = "Suele tardar unas cuatro semanas. En ese tiempo, dejamos tu propio servidor seguro con agentes inteligentes, perfectamente conectados a tu base de datos y listos para trabajar.";
    } else if (chipText === "¿Cuánto tardaré en ver resultados?") {
       responseDisplay = "Desde el primer mes vas a notar el cambio, con métricas claras que demuestran cómo mejora la captación de tus clientes.";
       responseSpeak = "Desde el primer mes vas a notar el cambio, con métricas claras que demuestran cómo mejora la captación de tus clientes.";
    } else if (chipText === "Sobre nosotros") {
       responseDisplay = "Nosotros somos una agencia que se dedica exclusivamente a automatizar negocios de servicios. Usamos Inteligencia Artificial para garantizar que no vuelvas a perder ni una sola oportunidad de venta.";
       responseSpeak = "Nosotros somos una agencia que se dedica exclusivamente a automatizar negocios de servicios. Usamos Inteligencia Artificial para garantizar que no vuelvas a perder ni una sola oportunidad de venta.";
    } else if (chipText === "Nuestros servicios") {
       responseDisplay = "Creamos agentes inteligentes que agendan tus citas y atienden a tus clientes sin que tú hagas nada, directamente por WhatsApp, Web, Telegram o llamadas. Además, los integramos a tus bases de datos para que la información de los clientes se sincronice al instante sin trabajo manual.";
       responseSpeak = "Creamos agentes inteligentes que agendan tus citas y atienden a tus clientes sin que tú hagas nada, directamente por WhatsApp, Web, Telegram o llamadas. Además, los integramos a tus bases de datos, para que la información de los clientes se sincronice al instante sin trabajo manual.";
    } else if (chipText === "📅 Agendar cita") {
       responseDisplay = "¡Me parece perfecto! Te abro el calendario en tu pantalla. Solo elige el día y la hora que mejor te venga para estudiar tu caso a fondo.";
       responseSpeak = "¡Me parece perfecto! Te abro el calendario en tu pantalla. Solo elige el día y la hora que mejor te venga para estudiar tu caso a fondo.";
       setTimeout(() => {
         window.open('https://calendly.com/agentminds', '_blank');
       }, 2000);
    } else {
       responseDisplay = "Vale, te entiendo perfectamente. Un especialista revisará esto contigo enseguida.";
       responseSpeak = "Vale, te entiendo perfectamente. Un especialista revisará esto contigo enseguida.";
    }

    if (responseDisplay) {
      setTimeout(() => {
        this.currentChipView.set(nextView);
        this.addMessage('assistant', responseDisplay);
        this.playVoiceResponse(responseSpeak);
      }, 500); // UI feel delay
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string) {
    this.messages.update(msgs => [...msgs, { role, content }]);
    this.scrollToBottom();
  }

  private playVoiceResponse(text: string) {
    this.isPlaying.set(true);
    this.voiceService.speak(text, this.selectedVoiceId).subscribe({
      next: url => {
        if (url) {
          const audio = new Audio(url);
          audio.onended = () => {
             this.isPlaying.set(false);
             this.showChips.set(true);
          };
          audio.play().catch(e => {
            this.isPlaying.set(false);
            this.showChips.set(true);
          });
        } else {
          this.isPlaying.set(false);
          this.showChips.set(true);
        }
      },
      error: () => {
        this.isPlaying.set(false);
        this.showChips.set(true);
      }
    });
  }

  private scrollToBottom() {
    // Delay to let Angular render the new DOM item, then scroll
    setTimeout(() => {
       const el = document.getElementById('chat-messages-container');
       if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  closeChat() {
    this.isChatActive.set(false);
  }
}

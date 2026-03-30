import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceService } from '../../../core/services/voice.service';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  showTranscript?: boolean;
  isPlaying?: boolean;
  progressPercent?: number;
  currentTime?: string;
  totalTime?: string;
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
  private msgIdCounter = 0;
  
  // Chat History
  messages = signal<ChatMessage[]>([
    { 
      id: this.msgIdCounter++, 
      role: 'assistant', 
      content: '¡Hola! Soy tu asistente virtual. ¿Te gustaría ver cómo filtramos y cualificamos automáticamente a tus pacientes capilares?',
      showTranscript: false,
      progressPercent: 0,
      currentTime: '0:00',
      totalTime: '0:00',
      isPlaying: false
    }
  ]);

  currentChipView = signal<'main' | 'faqs'>('main');
  clickedChips = signal<Set<string>>(new Set());

  private greetingDisplay = "¡Hola! Soy tu asistente virtual. ¿Te gustaría ver cómo filtramos y cualificamos automáticamente a tus pacientes capilares?";
  private greetingSpeak = "¡Hola! ... Soy tu asistente virtual. ... ¿Te gustaría ver cómo filtramos, y cualificamos automáticamente a tus pacientes capilares?";
  private selectedVoiceId = "Lucia"; 

  ngOnInit() {
    this.voiceService.preload(this.greetingSpeak, this.selectedVoiceId);
  }

  startChat() {
    this.isChatActive.set(true);
    this.playGreeting();
  }

  playGreeting() {
    this.isPlaying.set(true);
    this.showChips.set(false);
    this.playVoiceResponse(this.greetingSpeak, 0); 
  }

  toggleTranscript(msgId: number) {
    this.messages.update(msgs => msgs.map(m => m.id === msgId ? { ...m, showTranscript: !m.showTranscript } : m));
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  handleChipClick(chipText: string) {
    this.addMessage('user', chipText);
    this.showChips.set(false); 
    
    this.clickedChips.update(set => {
      const newSet = new Set(set);
      newSet.add(chipText);
      return newSet;
    });

    let responseDisplay = "";
    let responseSpeak = "";
    let nextView: 'main' | 'faqs' = this.currentChipView();

    if (chipText === "❓ Dudas Operativas") {
      nextView = 'faqs';
      responseDisplay = "Por supuesto. Los directores de clínicas suelen tener estas dudas. ¿Qué te gustaría profundizar?";
      responseSpeak = "Por supuesto. ... Los directores de clínicas, suelen tener este tipo de dudas. ... Cuéntame, ¿en qué punto te gustaría profundizar?";
    } else if (chipText === "↩️ Volver a opciones") {
      nextView = 'main';
      responseDisplay = "¿Hay alguna otra métrica o proceso que te gustaría explorar?";
      responseSpeak = "¿Hay alguna otra métrica..., o proceso interno, que te gustaría explorar?";
    } else if (chipText === "¿Cómo pre-evalúan al paciente?") {
       responseDisplay = "Integramos un protocolo clínico en tu Web y WhatsApp. El agente conversa de forma fluida con el paciente sobre su caso, pide fotografías en tiempo real e identifica la viabilidad médica antes de agendar.";
       responseSpeak = "Integramos un protocolo clínico directamente en tu Web, ... y en tu Whats App corporativo. El agente virtual, conversa de forma muy fluida con el paciente sobre su caso empático, ... le pide fotografías en tiempo real, ... y finalmente, identifica la viabilidad médica, justo antes de enviarlo a la agenda.";
    } else if (chipText === "¿Cómo se adapta a mi agenda?") {
       responseDisplay = "La IA sincroniza los pacientes pre-calificados directamente con tu CRM y tu calendario actual. Además, reactivamos automáticamente antiguas listas de contactos de tu base de datos para generar consultas nuevas.";
       responseSpeak = "La inteligencia artificial, sincroniza los pacientes que ya están pre-calificados, ... directamente con el cé erre eme, o el calendario que uses actualmente. ... Y además de esto, reactivamos de forma automática, las antiguas listas de contactos de tu base de datos, para conseguirte consultas nuevas sin coste publicitario.";
    } else if (chipText === "¿Qué retorno (ROI) puedo esperar?") {
       responseDisplay = "Tus especialistas dejarán de perder tiempo en valoraciones gratuitas que no convierten. Filtraremos y educaremos únicamente a pacientes perfilados por la IA con alta intención de compra, maximizando la facturación y optimizando las horas del equipo.";
       responseSpeak = "El retorno es muy claro. ... Tus especialistas, dejarán de perder el tiempo en valoraciones gratuitas que nunca convierten. ... Nosotros nos encargamos de filtrar y educar a los pacientes perfilados, ... pacientes con una intención de compra real,... lo cual maximiza la facturación mensual, y optimiza muchísimo las horas de tu equipo.";
    } else if (chipText === "Sobre la tecnología") {
       responseDisplay = "Diseñamos sistemas automatizados que blindan tu clínica. Evitamos la fuga de pacientes por demoras, multiplicamos la captación reteniendo el interés al instante y ahorramos cientos de horas de gestión manual a tu equipo.";
       responseSpeak = "Diseñamos sistemas automatizados que blindan por completo tu clínica. ... El objetivo es muy claro: ... evitar la fuga de pacientes por culpa de las demoras, ... multiplicar la captación reteniendo su interés desde el primer segundo, ... y ahorrarle cientos de horas de gestión manual a todo tu equipo.";
    } else if (chipText === "Filtrado automático") {
       responseDisplay = "Quitamos esa carga a tus comerciales. El agente despeja, uno a uno, todos los miedos al tratamiento, explica técnicas o tiempos de recuperación, y negocia la cualificación antes de derivar la visita presencial.";
       responseSpeak = "Le quitamos toda esa carga pesada a tu equipo comercial. ... El agente es capaz de despejar, uno a uno, todos los miedos típicos frente al tratamiento,... les explica las técnicas o los tiempos de recuperación con paciencia,... y negocia si el paciente está cualificado, antes de derivar una visita presencial a la clínica.";
    } else if (chipText === "📅 Auditar mi estrategia (Gratis)") {
       responseDisplay = "¡Excelente decisión! Te abro el circuito de reservas. Selecciona un bloque horario y un especialista en infraestructuras tecnológicas analizará en directo tu estrategia de captación actual.";
       responseSpeak = "¡Excelente decisión! ... Te voy a abrir el circuito de reservas. ... Solo tienes que seleccionar un bloque horario que te venga bien,... y un experto en infraestructuras tecnológicas, se conectará contigo para analizar en directo tu estrategia de captación actual.";
       setTimeout(() => {
         window.open('https://calendly.com/agentminds', '_blank');
       }, 2000);
    } else {
       responseDisplay = "Entendido. Un coordinador revisará esta consulta en detalle de manera inminente.";
       responseSpeak = "Entendido. ... Un coordinador revisará tu consulta en detalle ahora mismo.";
    }

    if (responseDisplay) {
      setTimeout(() => {
        this.currentChipView.set(nextView);
        const newMsgId = this.addMessage('assistant', responseDisplay);
        this.playVoiceResponse(responseSpeak, newMsgId);
      }, 500);
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string): number {
    const id = this.msgIdCounter++;
    this.messages.update(msgs => [...msgs, { 
      id, role, content, showTranscript: false, 
      progressPercent: 0, currentTime: '0:00', totalTime: '0:00', isPlaying: false 
    }]);
    this.scrollToBottom();
    return id;
  }

  private updateMessageState(msgId: number, changes: Partial<ChatMessage>) {
    this.messages.update(msgs => msgs.map(m => m.id === msgId ? { ...m, ...changes } : m));
  }

  private playVoiceResponse(text: string, msgId: number) {
    this.isPlaying.set(true);
    this.updateMessageState(msgId, { isPlaying: true, progressPercent: 0, currentTime: '0:00' });

    this.voiceService.speak(text, this.selectedVoiceId).subscribe({
      next: url => {
        if (url) {
          const audio = new Audio(url);
          
          audio.addEventListener('loadedmetadata', () => {
             if (audio.duration && isFinite(audio.duration)) {
                this.updateMessageState(msgId, { totalTime: this.formatTime(audio.duration) });
             }
          });

          audio.addEventListener('timeupdate', () => {
             const duration = audio.duration && isFinite(audio.duration) ? audio.duration : Math.max(audio.currentTime, 1);
             const progress = (audio.currentTime / duration) * 100;
             this.updateMessageState(msgId, {
                currentTime: this.formatTime(audio.currentTime),
                progressPercent: Math.min(progress, 100)
             });
             
             if (audio.duration && isFinite(audio.duration)) {
                this.updateMessageState(msgId, { totalTime: this.formatTime(audio.duration) });
             }
          });

          audio.onended = () => {
             this.isPlaying.set(false);
             this.showChips.set(true);
             this.updateMessageState(msgId, { isPlaying: false, progressPercent: 100 });
          };
          
          audio.play().catch(e => {
            this.isPlaying.set(false);
            this.showChips.set(true);
            this.updateMessageState(msgId, { isPlaying: false, progressPercent: 100 });
          });
        } else {
          this.isPlaying.set(false);
          this.showChips.set(true);
          this.updateMessageState(msgId, { isPlaying: false });
        }
      },
      error: () => {
        this.isPlaying.set(false);
        this.showChips.set(true);
        this.updateMessageState(msgId, { isPlaying: false });
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
       const el = document.getElementById('chat-messages-container');
       if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  closeChat() {
    this.isChatActive.set(false);
  }
}

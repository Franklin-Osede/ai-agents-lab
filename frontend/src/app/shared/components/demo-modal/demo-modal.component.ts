import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Agent } from '../../models/agent.model';
import { ApiService } from '../../services/api.service';
import { ChatMessage } from '../../models/agent.model';

@Component({
  selector: 'app-demo-modal',
  templateUrl: './demo-modal.component.html',
  styleUrls: ['./demo-modal.component.scss'],
})
export class DemoModalComponent implements OnInit {
  @Input() agent!: Agent;
  @Output() close = new EventEmitter<void>();

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  metrics: {
    responseTime?: number;
    intent?: string;
    confidence?: number;
  } = {};
  extractedEntities?: {
    dates: string[];
    times: string[];
    services: string[];
    location?: string;
    people?: number;
  };
  voiceMessage?: {
    script: string;
    audioUrl: string;
    videoUrl?: string;
    duration?: number;
    estimatedCost?: number;
  };
  exampleMessages: string[] = [];
  useCaseDescription = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.setupAgentSpecificContent();
    this.addWelcomeMessage();
  }

  setupAgentSpecificContent(): void {
    const content: Record<string, { examples: string[]; description: string }> = {
      booking: {
        examples: [
          'Quiero reservar una cita para mañana a las 2pm',
          'Necesito una cita esta semana',
          '¿Tienen disponibilidad el viernes por la tarde?',
          'Quiero cancelar mi cita del lunes',
        ],
        description: 'Simula cómo tus clientes pueden reservar citas automáticamente. El agente detecta la intención, sugiere horarios disponibles y confirma la reserva.',
      },
      'dm-response': {
        examples: [
          '¿Cuánto cuesta el tratamiento de botox?',
          '¿Tienen disponibilidad esta semana?',
          '¿Qué servicios ofrecen?',
          'Necesito información sobre precios',
        ],
        description: 'Simula respuestas automáticas a mensajes directos de Instagram/WhatsApp. El agente responde preguntas comunes sobre precios, servicios y disponibilidad.',
      },
      'follow-up': {
        examples: [
          'Consulta sobre servicios de estética hace 3 días',
          'Cliente preguntó precios hace 5 días pero no reservó',
          'Primera consulta hace una semana, necesita seguimiento',
          'Cliente interesado en botox pero no concretó cita',
        ],
        description: 'Genera mensajes de seguimiento personalizados para reconectar con clientes. El agente crea mensajes apropiados según el tiempo transcurrido y el contexto de la última interacción.',
      },
      voice: {
        examples: [
          'Cliente consultó sobre botox hace 3 días',
          'Seguimiento post-consulta con video personalizado',
          'Onboarding de nuevo cliente con mensaje de voz',
          'Recordatorio de cita con audio personalizado',
        ],
        description: 'Genera mensajes de voz y video personalizados con IA. Crea contenido multimedia que aumenta engagement y conversiones. Usa D-ID para generar audio y video profesional.',
      },
    };

    const agentContent = content[this.agent.id] || { examples: [], description: '' };
    this.exampleMessages = agentContent.examples;
    this.useCaseDescription = agentContent.description;
  }

  addWelcomeMessage(): void {
    const welcomeMessages: Record<string, string> = {
      booking: "👋 ¡Hola! Soy tu asistente de reservas. Puedo ayudarte a reservar citas, verificar disponibilidad y gestionar tus reservas. Prueba con uno de los ejemplos o escribe tu propia solicitud.",
      'dm-response': "💬 ¡Hola! Soy tu agente de respuestas automáticas. Respondo preguntas sobre precios, servicios y disponibilidad. Prueba con uno de los ejemplos o haz tu propia pregunta.",
      'follow-up': "🔄 ¡Hola! Soy tu agente de seguimiento. Genero mensajes personalizados para reconectar con tus clientes. Prueba con uno de los ejemplos para ver cómo funcionaría en tu negocio.",
      voice: "🎤 ¡Hola! Soy tu agente de voz. Genero mensajes de audio y video personalizados con IA para aumentar engagement. Prueba con uno de los ejemplos para ver cómo funcionaría.",
    };

    this.messages.push({
      id: 'welcome',
      content: welcomeMessages[this.agent.id] || '¡Hola! ¿Cómo puedo ayudarte?',
      sender: 'agent',
      timestamp: new Date(),
    });
  }

  getAgentGradient(): string {
    const gradients: Record<string, string> = {
      booking: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #1e3a8a 100%)',
      'dm-response': 'linear-gradient(135deg, #047857 0%, #065f46 50%, #064e3b 100%)',
      'follow-up': 'linear-gradient(135deg, #c2410c 0%, #9a3412 50%, #7c2d12 100%)',
      voice: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
    };
    return gradients[this.agent.id] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  getPlaceholder(): string {
    const placeholders: Record<string, string> = {
      booking: 'Escribe tu solicitud de reserva...',
      'dm-response': 'Escribe tu pregunta...',
      'follow-up': 'Describe la situación del cliente...',
      voice: 'Describe el contexto para el mensaje de voz...',
    };
    return placeholders[this.agent.id] || 'Escribe tu mensaje...';
  }

  useExample(example: string): void {
    this.currentMessage = example;
    this.sendMessage();
  }

  async sendMessage(): Promise<void> {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: this.currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    this.messages.push(userMessage);
    const messageToSend = this.currentMessage;
    this.currentMessage = '';
    this.isLoading = true;

    const startTime = Date.now();

    try {
      let response;
      switch (this.agent.id) {
        case 'booking':
          response = await this.apiService.processBooking(messageToSend).toPromise();
          break;
        case 'dm-response':
          response = await this.apiService.processDm(messageToSend).toPromise();
          break;
        case 'follow-up':
          response = await this.apiService
            .generateFollowUp(messageToSend, 3)
            .toPromise();
          break;
        case 'voice':
          response = await this.apiService
            .generateVoice(messageToSend, false)
            .toPromise();
          break;
        default:
          throw new Error('Unknown agent');
      }

      const responseTime = Date.now() - startTime;
      this.metrics.responseTime = responseTime;
      this.metrics.intent = response?.intent?.type;
      this.metrics.confidence = response?.intent?.confidence;

      // Extract entities if available (for booking agent)
      if (response?.entities) {
        this.extractedEntities = response.entities;
      } else {
        this.extractedEntities = undefined;
      }

      // Extract voice message if available (for voice agent)
      if (response && 'audioUrl' in response) {
        this.voiceMessage = {
          script: response.script || '',
          audioUrl: response.audioUrl || '',
          videoUrl: response.videoUrl,
          duration: response.duration,
          estimatedCost: response.estimatedCost,
        };
      } else {
        this.voiceMessage = undefined;
      }

      if (response) {
        const agentMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.message || response.response || 'Response received',
          sender: 'agent',
          timestamp: new Date(),
          intent: response.intent,
        };
        this.messages.push(agentMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      this.messages.push({
        id: (Date.now() + 2).toString(),
        content: 'Lo siento, encontré un error. Por favor, verifica que el backend esté corriendo y vuelve a intentar.',
        sender: 'agent',
        timestamp: new Date(),
      });
    } finally {
      this.isLoading = false;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}


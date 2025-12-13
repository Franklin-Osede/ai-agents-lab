import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Agent, AgentResponse } from '../../models/agent.model';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage } from '../../models/agent.model';
import { Router } from '@angular/router';
import { VoiceService } from '../../services/voice.service';

@Component({
  selector: 'app-demo-modal',
  templateUrl: './demo-modal.component.html',
  styleUrls: ['./demo-modal.component.scss'],
})
export class DemoModalComponent implements OnInit, OnDestroy {
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
  
  // Lead capture
  leadEmail = '';
  leadName = '';
  
  // Steps: 0 = Service Selector, 1 = Chat, 2 = Calendar, 3 = Professional, 4 = Confirmation, 5 = Success Message
  // 6 = Restaurant Selection, 7 = Menu Selection, 8 = Delivery Address (for restaurants)
  // 10 = Reservas, 11 = Avisos
  currentStep: number = 0;
  showSuccessMessage = false;
  
  // Restaurant flow state
  selectedRestaurant: { id: string; name: string; image: string; rating: number; reviews: number } | null = null;
  selectedMenuType: string | null = null;
  deliveryOption: 'dine-in' | 'delivery' | null = null;
  deliveryAddress: any = null; // PlaceResult from Google Maps
  private sessionId = this.generateSessionId();
  private timeouts: number[] = []; // Track all timeouts for cleanup
  
  // Voice properties
  currentAudio: HTMLAudioElement | null = null;
  isPlayingAudio = false;
  enableVoice = true; // Enable voice for booking agent
  
  // Helper methods for template type safety
  isStep(step: number): boolean {
    return this.currentStep === step;
  }
  selectedService: any = null;
  availableSlots: string[] = [];
  checkingAvailability = false;
  showLeadCapture = false;
  interactionCount = 0;
  detectedDayOptions: Array<{day: string, date: Date, label: string}> = [];
  selectedDayOption: {day: string, date: Date, label: string} | null = null;
  
  // Navigation
  activeTab: 'inicio' | 'reservas' | 'avisos' | 'perfil' = 'inicio';
  
  // Bookings/Reservas
  bookings: Array<{
    id: string;
    date: string;
    time: string;
    service: string;
    professional?: string;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    amount?: number;
    paymentStatus?: 'paid' | 'pending' | 'refunded';
  }> = [];
  
  // Notifications/Avisos
  notifications: Array<{
    id: string;
    type: 'reminder' | 'payment' | 'action' | 'offer' | 'message' | 'security';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    icon: string;
    color: string;
  }> = [];
  
  // Selected booking for details
  selectedBooking: any = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private voiceService: VoiceService
  ) {}

  ngOnInit(): void {
    console.log('DemoModalComponent ngOnInit - agent:', this.agent);
    if (!this.agent) {
      console.error('No agent provided to DemoModalComponent!');
      return;
    }

    // Special handling for abandoned cart - redirect to dashboard
    if (this.agent.id === 'cart-recovery' || this.agent.id === 'abandoned-cart') {
      this.router.navigate(['/abandoned-cart']);
      this.close.emit();
      return;
    }

    this.sessionId = this.generateSessionId();
    this.setupAgentSpecificContent();
    // For demo: start at service selector (step 0), then go to chat (step 1)
    this.currentStep = 0 as number; // Service selector step
    console.log('DemoModalComponent initialized - currentStep:', this.currentStep);
  }

  private generateSessionId(): string {
    return `demo_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  getExamples(): string[] {
    // Get contextual examples based on selected service
    if (this.selectedService) {
      const serviceExamples: Record<string, string[]> = {
        'clinica': ['Quiero agendar una consulta', '¿Tienen disponibilidad esta semana?', 'Necesito ver a un médico'],
        'dentista': ['Quiero una limpieza dental', '¿Cuándo tienen cita disponible?', 'Necesito una consulta'],
        'peluqueria': ['Quiero un corte de pelo', '¿Qué horarios tienen disponibles?', 'Me gustaría agendar una cita'],
        'estetica': ['Quiero un tratamiento facial', '¿Tienen disponibilidad?', 'Me gustaría reservar'],
        'restaurante': ['Quiero reservar una mesa', '¿Tienen disponibilidad para mañana?', 'Necesito hacer una reserva'],
      };
      
      const serviceId = this.selectedService.id?.toLowerCase();
      if (serviceExamples[serviceId]) {
        return serviceExamples[serviceId];
      }
    }
    
    const examples: Record<string, string[]> = {
      booking: [
        'Quiero agendar una cita',
        '¿Tienen disponibilidad esta semana?',
        'Me gustaría reservar'
      ],
      'cart-recovery': [
        'Ver carritos abandonados',
        'Enviar WhatsApp de recuperación',
        'Generar preview de email'
      ],
      'abandoned-cart': [
        'Ver carritos abandonados',
        'Enviar WhatsApp de recuperación',
        'Generar preview de email'
      ],
      'dm-response': [
        '¿Cuál es el horario de apertura?',
        '¿Hacéis envíos a Canarias?',
        'Tengo un problema con mi pedido'
      ],
      'follow-up': [
        'Cliente interesado en presupuesto web',
        'Usuario que preguntó por precios hace 3 días',
        'Lead cualificado sin respuesta'
      ],
      voice: [
        'Recordatorio de cita para mañana',
        'Confirmación de pedido enviado',
        'Bienvenida a nuevo cliente VIP'
      ]
    };
    return examples[this.agent.id] || [];
  }

  setupAgentSpecificContent(): void {
    const content: Record<string, { description: string }> = {
      booking: {
        description: 'Simula cómo tus clientes pueden reservar citas automáticamente. El agente detecta la intención, sugiere horarios disponibles y confirma la reserva.',
      },
      'cart-recovery': {
        description: 'Recupera carritos abandonados con mensajes personalizados por WhatsApp y email. El agente genera ofertas inteligentes basadas en el valor del carrito y el historial del cliente.',
      },
      'abandoned-cart': {
        description: 'Recupera carritos abandonados con mensajes personalizados por WhatsApp y email. El agente genera ofertas inteligentes basadas en el valor del carrito y el historial del cliente.',
      },
      'dm-response': {
        description: 'Simula respuestas automáticas a mensajes directos de Instagram/WhatsApp. El agente responde preguntas comunes sobre precios, servicios y disponibilidad.',
      },
      'follow-up': {
        description: 'Genera mensajes de seguimiento personalizados para reconectar con clientes. El agente crea mensajes apropiados según el tiempo transcurrido y el contexto de la última interacción.',
      },
      voice: {
        description: 'Genera mensajes de voz y video personalizados con IA. Crea contenido multimedia que aumenta engagement y conversiones. Usa D-ID para generar audio y video profesional.',
      },
    };

    const agentContent = content[this.agent.id] || { description: '' };
    this.exampleMessages = this.getExamples();
    this.useCaseDescription = agentContent.description;
  }

  addWelcomeMessage(serviceName?: string): void {
    // Get service context for natural conversation
    const serviceContext = this.getServiceContext(serviceName);
    
    if (this.agent.id === 'booking' && serviceContext) {
      // Natural, contextual welcome message based on service
      const welcomeMessage = serviceContext.welcomeMessage;
      
      this.messages.push({
        id: 'welcome',
        content: welcomeMessage,
        sender: 'agent',
        timestamp: new Date(),
      });
      
      // Store service context for the agent
    this.selectedService = {
      ...serviceContext,
      name: serviceName || serviceContext.name,
    };
    
    // Clear any previous day options when selecting a new service
    this.detectedDayOptions = [];
    this.selectedDayOption = null;
    
    // Update example messages based on selected service
    this.exampleMessages = this.getExamples();
    } else {
      // Fallback for other agents
      const welcomeMessages: Record<string, string> = {
        'dm-response': "💬 ¡Hola! Soy tu agente de respuestas automáticas. Respondo preguntas sobre precios, servicios y disponibilidad. Prueba con uno de los ejemplos o haz tu propia pregunta.",
        'follow-up': "🔄 ¡Hola! Soy tu agente de seguimiento. Genero mensajes personalizados para reconectar con tus clientes. Prueba con uno de los ejemplos para ver cómo funcionaría en tu negocio.",
        voice: "🎤 ¡Hola! Soy tu agente de voz. Genero mensajes de audio y video personalizados con IA para aumentar engagement. Prueba con uno de los ejemplos para ver cómo funcionaría.",
      };

      const welcomeMessage = welcomeMessages[this.agent.id] || '¡Hola! ¿Cómo puedo ayudarte?';
      
      this.messages.push({
        id: 'welcome',
        content: welcomeMessage,
        sender: 'agent',
        timestamp: new Date(),
      });
    }
  }

  addWelcomeMessageWithProfessional(): void {
    if (this.agent.id === 'booking' && this.selectedProfessionalData && this.selectedService) {
      const professionalName = this.selectedProfessionalData.name;
      const serviceName = this.selectedService.name;
      
      const welcomeMessage = `¡Perfecto! Has seleccionado a ${professionalName}. ¿Para qué fecha te gustaría agendar tu cita de ${serviceName}?`;
      
      this.messages.push({
        id: 'welcome-professional',
        content: welcomeMessage,
        sender: 'agent',
        timestamp: new Date(),
      });
      
      // Clear any previous day options when selecting a new service
      this.detectedDayOptions = [];
      this.selectedDayOption = null;
      
      // Update example messages based on selected service
      this.exampleMessages = this.getExamples();
    }
  }
  
  /**
   * Get service-specific context for natural conversation
   * @param serviceIdOrName - The service ID or name to look up
   */
  private getServiceContext(serviceIdOrName?: string): any {
    const serviceId = (serviceIdOrName || this.selectedService?.id || '').toLowerCase();
    console.log('🟣 getServiceContext called with:', serviceIdOrName, '-> serviceId:', serviceId);
    
    // Map all services to their contexts
    const contexts: Record<string, any> = {
      // Salud y Bienestar
      'clinica': {
        id: 'clinica',
        name: 'Clínica Médica',
        welcomeMessage: '👋 ¡Hola! Bienvenido a nuestra clínica. ¿En qué puedo ayudarte hoy? ¿Te gustaría reservar una consulta médica?',
        tone: 'profesional, empático y tranquilizador',
        businessType: 'salud',
        examples: ['Sí, me gustaría una consulta', 'Necesito ver a un médico', '¿Tienen disponibilidad esta semana?'],
      },
      'dentista': {
        id: 'dentista',
        name: 'Clínica Dental',
        welcomeMessage: '🦷 ¡Hola! Bienvenido a nuestra clínica dental. ¿Necesitas agendar una cita para una consulta o limpieza?',
        tone: 'profesional, tranquilizador y comprensivo',
        businessType: 'dentista',
        examples: ['Sí, necesito una limpieza', 'Quiero una consulta', '¿Cuándo tienen disponibilidad?'],
      },
      'fisioterapia': {
        id: 'fisioterapia',
        name: 'Fisioterapia',
        welcomeMessage: '🏥 ¡Hola! Bienvenido a nuestro centro de fisioterapia. ¿Te gustaría agendar una sesión?',
        tone: 'profesional y motivador',
        businessType: 'salud',
        examples: ['Sí, necesito una sesión', 'Quiero rehabilitación', '¿Qué horarios tienen?'],
      },
      'veterinaria': {
        id: 'veterinaria',
        name: 'Veterinaria',
        welcomeMessage: '🐾 ¡Hola! Bienvenido a nuestra clínica veterinaria. ¿Necesitas agendar una cita para tu mascota?',
        tone: 'amigable, empático y profesional',
        businessType: 'salud',
        examples: ['Sí, para mi perro', 'Necesito una vacunación', '¿Tienen emergencias?'],
      },
      // Belleza y Estética
      'peluqueria': {
        id: 'peluqueria',
        name: 'Peluquería',
        welcomeMessage: '💇 ¡Hola! Bienvenida a nuestra peluquería. ¿Te gustaría agendar una cita para un corte o peinado?',
        tone: 'amigable, acogedor y entusiasta',
        businessType: 'belleza',
        examples: ['Sí, quiero un corte', 'Me gustaría un peinado', '¿Qué horarios tienen?'],
      },
      'estetica': {
        id: 'estetica',
        name: 'Centro de Estética',
        welcomeMessage: '✨ ¡Hola! Bienvenida a nuestro centro de estética. ¿Te gustaría agendar un tratamiento?',
        tone: 'amigable, acogedor y entusiasta',
        businessType: 'belleza',
        examples: ['Sí, un tratamiento facial', 'Me gustaría depilación', '¿Qué servicios tienen?'],
      },
      'spa': {
        id: 'spa',
        name: 'Spa y Bienestar',
        welcomeMessage: '🧘 ¡Hola! Bienvenido a nuestro spa. ¿Te gustaría reservar un masaje o tratamiento relajante?',
        tone: 'tranquilo, relajante y profesional',
        businessType: 'belleza',
        examples: ['Sí, un masaje', 'Quiero relajarme', '¿Qué tratamientos tienen?'],
      },
      'unas': {
        id: 'unas',
        name: 'Manicura y Pedicura',
        welcomeMessage: '💅 ¡Hola! Bienvenida a nuestro salón de uñas. ¿Te gustaría agendar una cita?',
        tone: 'amigable y acogedor',
        businessType: 'belleza',
        examples: ['Sí, una manicura', 'Quiero esmaltado', '¿Qué diseños tienen?'],
      },
      // Restaurantes y Eventos
      'restaurante': {
        id: 'restaurante',
        name: 'Restaurante',
        welcomeMessage: '🍽️ ¡Hola! Bienvenido a nuestro restaurante. ¿Te gustaría hacer una reserva para alguna fecha?',
        tone: 'cordial, profesional y acogedor',
        businessType: 'restaurante',
        examples: ['Sí, quiero reservar una mesa', 'Para mañana por la noche', '¿Tienen disponibilidad este fin de semana?'],
      },
      'catering': {
        id: 'catering',
        name: 'Catering',
        welcomeMessage: '🎉 ¡Hola! Bienvenido a nuestro servicio de catering. ¿Necesitas organizar un evento?',
        tone: 'profesional y detallado',
        businessType: 'restaurante',
        examples: ['Sí, para un evento', 'Necesito catering', '¿Qué menús tienen?'],
      },
      'eventos': {
        id: 'eventos',
        name: 'Salón de Eventos',
        welcomeMessage: '🎊 ¡Hola! Bienvenido a nuestro salón de eventos. ¿Te gustaría reservar para una celebración?',
        tone: 'entusiasta y profesional',
        businessType: 'restaurante',
        examples: ['Sí, para una fiesta', 'Quiero reservar el salón', '¿Qué capacidad tienen?'],
      },
      // Servicios Profesionales
      'abogado': {
        id: 'abogado',
        name: 'Despacho de Abogados',
        welcomeMessage: '⚖️ ¡Hola! Bienvenido a nuestro despacho. ¿Necesitas una consulta legal?',
        tone: 'profesional, formal y confiable',
        businessType: 'profesional',
        examples: ['Sí, necesito asesoría', 'Quiero una consulta', '¿Qué servicios ofrecen?'],
      },
      'contador': {
        id: 'contador',
        name: 'Contador/Asesor Fiscal',
        welcomeMessage: '📊 ¡Hola! Bienvenido a nuestro despacho contable. ¿Necesitas asesoría fiscal o contable?',
        tone: 'profesional, preciso y confiable',
        businessType: 'profesional',
        examples: ['Sí, asesoría fiscal', 'Necesito ayuda contable', '¿Qué servicios tienen?'],
      },
      'consultor': {
        id: 'consultor',
        name: 'Consultoría',
        welcomeMessage: '💼 ¡Hola! Bienvenido a nuestra consultoría. ¿Necesitas asesoría empresarial?',
        tone: 'profesional y estratégico',
        businessType: 'profesional',
        examples: ['Sí, consultoría', 'Necesito asesoría', '¿Qué servicios ofrecen?'],
      },
      'coach': {
        id: 'coach',
        name: 'Coaching Personal',
        welcomeMessage: '🎯 ¡Hola! Bienvenido a nuestro servicio de coaching. ¿Te gustaría agendar una sesión?',
        tone: 'motivador y empático',
        businessType: 'profesional',
        examples: ['Sí, una sesión', 'Quiero coaching', '¿Qué programas tienen?'],
      },
      // Otros Negocios
      'fontanero': {
        id: 'fontanero',
        name: 'Fontanería',
        welcomeMessage: '🔧 ¡Hola! Bienvenido a nuestro servicio de fontanería. ¿Necesitas una reparación o instalación?',
        tone: 'práctico, eficiente y profesional',
        businessType: 'servicio',
        examples: ['Sí, una reparación', 'Necesito instalación', '¿Tienen disponibilidad urgente?'],
      },
      'electricista': {
        id: 'electricista',
        name: 'Electricista',
        welcomeMessage: '⚡ ¡Hola! Bienvenido a nuestro servicio eléctrico. ¿Necesitas una instalación o reparación?',
        tone: 'práctico, eficiente y profesional',
        businessType: 'servicio',
        examples: ['Sí, una reparación', 'Necesito instalación', '¿Tienen disponibilidad?'],
      },
      'fitness': {
        id: 'fitness',
        name: 'Gimnasio',
        welcomeMessage: '💪 ¡Hola! Bienvenido a nuestro gimnasio. ¿Te gustaría reservar una clase o sesión con un entrenador?',
        tone: 'motivador, energético y positivo',
        businessType: 'fitness',
        examples: ['Sí, quiero una clase', 'Me gustaría un entrenador personal', '¿Qué horarios tienen disponibles?'],
      },
      'educacion': {
        id: 'educacion',
        name: 'Academia/Tutorías',
        welcomeMessage: '📚 ¡Hola! Bienvenido a nuestra academia. ¿Te gustaría agendar una clase o tutoría?',
        tone: 'educativo, paciente y motivador',
        businessType: 'educacion',
        examples: ['Sí, una clase', 'Quiero tutoría', '¿Qué materias enseñan?'],
      },
      'reparaciones': {
        id: 'reparaciones',
        name: 'Reparaciones',
        welcomeMessage: '🛠️ ¡Hola! Bienvenido a nuestro taller. ¿Necesitas reparar algo?',
        tone: 'práctico y eficiente',
        businessType: 'servicio',
        examples: ['Sí, una reparación', 'Necesito arreglar algo', '¿Qué reparan?'],
      },
      // Fallbacks
      'salud': {
        id: 'salud',
        name: 'Salud',
        welcomeMessage: '👋 ¡Hola! Bienvenido a nuestra clínica. ¿En qué puedo ayudarte hoy?',
        tone: 'profesional, empático y tranquilizador',
        businessType: 'salud',
        examples: ['Sí, me gustaría una consulta', 'Necesito ver a un médico', '¿Tienen disponibilidad esta semana?'],
      },
      'belleza': {
        id: 'belleza',
        name: 'Belleza',
        welcomeMessage: '💅 ¡Hola! Bienvenida a nuestro salón de belleza. ¿Te gustaría agendar una cita?',
        tone: 'amigable, acogedor y entusiasta',
        businessType: 'belleza',
        examples: ['Sí, quiero un tratamiento', 'Me gustaría una cita', '¿Qué servicios tienen?'],
      },
    };
    
    // Try to find by exact id match first
    if (contexts[serviceId]) {
      console.log('🟣 getServiceContext: Found exact match for:', serviceId);
      return contexts[serviceId];
    }
    
    // Try to find by partial match
    for (const [key, context] of Object.entries(contexts)) {
      if (serviceId.includes(key) || key.includes(serviceId)) {
        console.log('🟣 getServiceContext: Found partial match:', key, 'for:', serviceId);
        return context;
      }
    }
    
    // If service has businessType, use it (but don't override id/name)
    if (this.selectedService?.businessType) {
      const businessType = this.selectedService.businessType.toLowerCase();
      console.log('🟣 getServiceContext: Using businessType fallback:', businessType);
      if (businessType === 'salud' || businessType === 'dentista') {
        return contexts['salud'];
      }
      if (businessType === 'belleza') {
        return contexts['belleza'];
      }
      if (businessType === 'restaurante') {
        return contexts['restaurante'];
      }
      if (businessType === 'fitness') {
        return contexts['fitness'];
      }
    }
    
    // Default to salud
    console.log('🟣 getServiceContext: Using default (salud)');
    return contexts['salud'];
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

  calendarData = {
    currentDate: new Date(),
    availableSlots: [] as string[],
    selectedSlot: null as string | null
  };

  // Wizard State
  selectedProfessional: string | null = null;
  selectedProfessionalData: { name: string; image: string; title: string; rating: number; reviews: number } | null = null;
  selectedRole: 'professional' | 'client' | null = null;
  showAuthScreen: 'login' | 'register' | null = null;
  showCalendarModal = false;
  selectedFilter: 'best-rated' | 'nearest' | 'price-low' | 'availability' = 'best-rated';
  
  // Cache for professionals to avoid multiple calls
  private cachedProfessionals: Array<{ name: string; image: string; title: string; rating: number; reviews: number; distance: string; description: string }> = [];
  private cachedServiceId: string | null = null;
  
  // Get professionals based on selected service
  getProfessionalsForService(): Array<{ name: string; image: string; title: string; rating: number; reviews: number; distance: string; description: string }> {
    console.log('🟢 getProfessionalsForService CALLED');
    console.log('🟢 this.selectedService:', this.selectedService);
    
    if (!this.selectedService) {
      console.error('❌ ERROR: selectedService is null/undefined!');
      console.error('❌ Returning empty array');
      return [];
    }
    
    const serviceId = this.selectedService?.id?.toLowerCase() || 'health';
    const serviceCategory = this.selectedService?.category?.toLowerCase() || 'salud';
    const serviceName = this.selectedService?.name?.toLowerCase() || '';
    
    // Check cache first
    if (this.cachedServiceId === serviceId && this.cachedProfessionals.length > 0) {
      console.log('🟢 Using CACHED professionals for serviceId:', serviceId);
      return this.cachedProfessionals;
    }
    
    // Debug logging
    console.log('🟢 getProfessionalsForService INPUT:', {
      serviceId: serviceId,
      serviceIdOriginal: this.selectedService?.id,
      serviceName: serviceName,
      serviceNameOriginal: this.selectedService?.name,
      serviceCategory: serviceCategory,
      serviceCategoryOriginal: this.selectedService?.category,
      businessType: this.selectedService?.businessType
    });
    
    // Professional images by category
    const professionalImages: Record<string, string[]> = {
      // Salud - Dentistas (imágenes ÚNICAS de dentistas - ninguna duplicada)
      'dentista': [
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1594824476968-48aa8a6701b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90'
      ],
      // Médicos (imágenes COMPLETAMENTE DIFERENTES - ninguna duplicada con dentistas)
      // Imagen específica para Sofía Ramírez (Cardióloga) - índice 2
      'medico': [
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90', // Sofía Ramírez - Cardióloga
        'https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1537368910025-700350fe46c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90'
      ],
      // Fisioterapeutas (imágenes de personas haciendo terapia física/ejercicios)
      'fisioterapeuta': [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
        'https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'
      ],
      // Veterinaria (veterinarios con animales o en clínica veterinaria)
      'veterinaria': [
        'https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1551717743-49959800b1f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90'
      ],
      // Belleza (peluquería - personas trabajando en salón de belleza)
      // Imagen específica para Carmen López (índice 3) - asegurar que sea diferente
      'belleza': [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90', // María García (0)
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90', // Ana Martínez (1)
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90', // Laura Rodríguez (2)
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90', // Carmen López (3) - IMAGEN ESPECÍFICA DIFERENTE
        'https://images.unsplash.com/photo-1492106087820-3f1b6c6f04fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90' // Sofía Hernández (4)
      ],
      // Estética removida - ahora se usa 'estetica' para centros de estética (negocios) más abajo
      // Restaurantes (imágenes de restaurantes/interiores, no chefs)
      'restaurante': [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1552569973-610e8c0e0b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90'
      ],
      // Eventos (organizadores de eventos profesionales)
      'eventos': [
        'https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90'
      ],
      // Abogados (profesionales en traje formal)
      'abogado': [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90'
      ],
      // Contadores (profesionales de negocios)
      'contador': [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90'
      ],
      // Fontaneros/Plomeros (trabajadores con herramientas)
      'fontanero': [
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90'
      ],
      // Electricistas (trabajadores con herramientas eléctricas)
      'electricista': [
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90'
      ],
      // Gimnasios (interiores de gimnasios)
      'fitness': [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90'
      ],
      // Tutores (profesores/educadores)
      'educacion': [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90'
      ],
      // Centros de Estética (negocios, no profesionales) - FOTOS DIFERENTES a peluquería
      'estetica': [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90'
      ],
      // Spas (negocios, no profesionales)
      'spa': [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=90'
      ],
      // Manicura y Pedicura (profesionales trabajando con uñas)
      'unas': [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1492106087820-3f1b6c6f04fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500&q=90'
      ],
      // Default (Salud)
      'default': [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBE4yakc8KsZUroNzuloMEDDBgRQG3HfRUSjABGuudk0BuLvQ4OjJWW2QyuOw_XMdJrw7Pds6Lb3J4pxxSotRY9AQI5Edqb7nKPSORa9Brf4o-t3HJS_W41kFOR5dHQS_Z79fCmEtPqrIIcj5fcuZgg2SZdeti5STGfIr39YNV8wAGr7FJC4jBayOQAeIfeA8mta1rFgBMWU5IzyaJFgYV6yjXDpheV9o5O-D0EbbY6FV2wPJvpvX65t5hcI7md-UOA6i8ZgZuTobBx',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBAbbiqAyIHdA1mmoDvmjpiSKvWPo7yvNzxj9c9YlidqNRtMFpQzKt0c2nXfUlLXBLCL3y8Abdn3p1Ohbs-kkGuQUD7A2-KYpcGHqKf_1B9TambJhIkup_cg-1ZiWsUyXuF8JFSOEN4U4paBkWFd6Q5oyb0bOFPw40xJjl1e11uNrtcMtcOwUzyV4ozg4Gy8Pw3A7yn88gANumuIazzQVFeqV8INQbTQMJyYiWzWV6ULGAzP8R5SjGLmmwO3bwwFvhJXGZa3_qvRZu7',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCLx8AaN_c5dIs8i057DddbBq1f-V5Q6uEVqh3LTNaJCb_WetM__oEvwCw4xeyWBLRnm9LsDuL2vl_OzmmNLd42VzurliIUmBGsan7EsL8KfMR_XH6qFy5X_b4p6YrhhGjOm0mn8T-W8psrSbhov3P8Tne7uuZ5AMJtdbaSfTalFxg8aeSlYluy6yP477lRCeOEONnLPuw7HJsdMNhnlEm-3h8Ap1TBHBa-pvbepRSyERBdhmKc_VffKkdHIuj4ZYTyRGOy1rR3oLbb'
      ]
    };
    
    // Professional data by category
    const professionalsByCategory: Record<string, Array<{ name: string; title: string; rating: number; reviews: number; distance: string; description: string }>> = {
      'dentista': [
        { name: 'Dr. Carlos Méndez', title: 'Dentista', rating: 4.9, reviews: 145, distance: '1.8km', description: 'Especialista en ortodoncia y estética dental con más de 15 años de experiencia.' },
        { name: 'Dra. Laura Sánchez', title: 'Odontóloga', rating: 4.8, reviews: 98, distance: '2.3km', description: 'Experta en implantes dentales y rehabilitación oral.' },
        { name: 'Dr. Miguel Torres', title: 'Dentista', rating: 4.7, reviews: 112, distance: '0.9km', description: 'Especializado en endodoncia y tratamientos de conducto.' },
        { name: 'Dra. Patricia Ramírez', title: 'Dentista Pediátrica', rating: 4.9, reviews: 167, distance: '1.5km', description: 'Especialista en odontología infantil y tratamientos para niños con más de 10 años de experiencia.' },
        { name: 'Dr. Javier Morales', title: 'Dentista', rating: 4.8, reviews: 142, distance: '2.1km', description: 'Especialista en prótesis dentales y rehabilitación oral completa.' }
      ],
      'medico': [
        { name: 'Dr. Ana García', title: 'Pediatra', rating: 4.9, reviews: 120, distance: '2.5km', description: 'Especialista en cuidado infantil y desarrollo temprano con más de 10 años de experiencia en hospitales públicos.' },
        { name: 'Dr. Roberto Martínez', title: 'Médico General', rating: 4.8, reviews: 95, distance: '1.2km', description: 'Atención médica integral para toda la familia con enfoque preventivo.' },
        { name: 'Dra. Sofía Ramírez', title: 'Cardióloga', rating: 4.9, reviews: 156, distance: '3.1km', description: 'Especialista en enfermedades cardiovasculares y medicina preventiva.' },
        { name: 'Dr. Luis Hernández', title: 'Dermatólogo', rating: 4.8, reviews: 142, distance: '1.9km', description: 'Especialista en enfermedades de la piel, tratamientos estéticos y dermatología clínica.' },
        { name: 'Dra. Carmen Vega', title: 'Ginecóloga', rating: 4.9, reviews: 178, distance: '2.2km', description: 'Especialista en salud femenina, obstetricia y ginecología con más de 12 años de experiencia.' }
      ],
      'fisioterapeuta': [
        { name: 'Carlos Ruiz', title: 'Fisioterapeuta', rating: 4.8, reviews: 85, distance: '1.2km', description: 'Rehabilitación deportiva y terapia manual avanzada para recuperación de lesiones musculares.' },
        { name: 'María González', title: 'Fisioterapeuta', rating: 4.9, reviews: 134, distance: '2.0km', description: 'Especialista en fisioterapia neurológica y tratamiento de dolor crónico.' },
        { name: 'Javier López', title: 'Fisioterapeuta Deportivo', rating: 4.7, reviews: 67, distance: '1.5km', description: 'Rehabilitación de lesiones deportivas y preparación física.' },
        { name: 'Elena Martínez', title: 'Fisioterapeuta', rating: 4.9, reviews: 156, distance: '1.8km', description: 'Especialista en fisioterapia geriátrica y tratamiento de problemas posturales.' },
        { name: 'Roberto Sánchez', title: 'Fisioterapeuta', rating: 4.8, reviews: 123, distance: '2.4km', description: 'Experto en terapia acuática y rehabilitación de lesiones de columna vertebral.' }
      ],
      'veterinaria': [
        { name: 'Dra. Patricia Fernández', title: 'Veterinaria', rating: 4.9, reviews: 178, distance: '1.5km', description: 'Especialista en medicina felina y canina con más de 12 años de experiencia.' },
        { name: 'Dr. Andrés Morales', title: 'Veterinario', rating: 4.8, reviews: 142, distance: '2.2km', description: 'Experto en cirugía veterinaria y medicina de emergencia.' },
        { name: 'Dra. Carmen Vega', title: 'Veterinaria', rating: 4.7, reviews: 89, distance: '0.8km', description: 'Especializada en animales exóticos y medicina preventiva.' },
        { name: 'Dr. Fernando Torres', title: 'Veterinario', rating: 4.9, reviews: 165, distance: '1.9km', description: 'Especialista en medicina interna y diagnóstico por imagen veterinaria.' },
        { name: 'Dra. Laura Jiménez', title: 'Veterinaria', rating: 4.8, reviews: 134, distance: '2.6km', description: 'Experta en comportamiento animal y medicina preventiva para mascotas.' }
      ],
      'belleza': [
        { name: 'María García', title: 'Peluquera', rating: 4.9, reviews: 203, distance: '1.1km', description: 'Especialista en cortes modernos, coloración y tratamientos capilares premium.' },
        { name: 'Ana Martínez', title: 'Peluquera', rating: 4.8, reviews: 167, distance: '2.4km', description: 'Especialista en cortes de cabello, peinados y tratamientos capilares para mujeres.' },
        { name: 'Laura Rodríguez', title: 'Barbería', rating: 4.7, reviews: 124, distance: '1.8km', description: 'Especialista en cortes masculinos, afeitados clásicos y barbas. Barbería tradicional y moderna.' },
        { name: 'Carmen López', title: 'Peluquera', rating: 4.9, reviews: 189, distance: '1.5km', description: 'Especialista en técnicas de coloración avanzada, mechas y balayage.' },
        { name: 'Sofía Hernández', title: 'Barbería', rating: 4.8, reviews: 156, distance: '2.1km', description: 'Especialista en cortes masculinos, tratamientos de barba y afeitados profesionales.' }
      ],
      // Estética removida - ahora se usa 'estetica' para centros de estética (negocios) más abajo
      'restaurante': [
        { name: 'La Trattoria Italiana', title: 'Restaurante Italiano', rating: 4.9, reviews: 234, distance: '0.5km', description: 'Cocina gourmet italiana con más de 20 años de experiencia. Especialidades en pasta fresca y pizzas artesanales.' },
        { name: 'Sushi Master', title: 'Restaurante Japonés', rating: 4.8, reviews: 178, distance: '1.3km', description: 'Sushi de alta calidad y cocina japonesa tradicional. Chef con certificación internacional.' },
        { name: 'El Asador', title: 'Restaurante de Carnes', rating: 4.7, reviews: 156, distance: '2.0km', description: 'Carnes premium a la parrilla y cocina mediterránea con ingredientes locales frescos.' },
        { name: 'Café Paris', title: 'Restaurante Francés', rating: 4.9, reviews: 198, distance: '1.7km', description: 'Cocina francesa auténtica con ambiente elegante. Especialidades en foie gras y vinos selectos.' },
        { name: 'Mariscos del Puerto', title: 'Restaurante de Mariscos', rating: 4.8, reviews: 167, distance: '2.5km', description: 'Mariscos frescos del día y pescados a la parrilla. Ambiente costero y servicio familiar.' }
      ],
      'eventos': [
        { name: 'Elena Martínez', title: 'Organizadora de Eventos', rating: 4.9, reviews: 198, distance: '1.2km', description: 'Planificación y coordinación de bodas, eventos corporativos y celebraciones especiales.' },
        { name: 'Roberto Sánchez', title: 'Coordinador de Eventos', rating: 4.8, reviews: 167, distance: '2.5km', description: 'Especialista en eventos corporativos y lanzamientos de producto.' },
        { name: 'Laura Fernández', title: 'Event Planner', rating: 4.7, reviews: 134, distance: '1.8km', description: 'Diseño y ejecución de eventos sociales y culturales.' },
        { name: 'Carmen López', title: 'Organizadora de Bodas', rating: 4.9, reviews: 189, distance: '1.5km', description: 'Especialista en bodas y eventos sociales. Diseño floral y decoración personalizada.' },
        { name: 'Miguel Torres', title: 'Coordinador de Eventos', rating: 4.8, reviews: 156, distance: '2.1km', description: 'Organización de eventos corporativos, conferencias y convenciones empresariales.' }
      ],
      // Abogados
      'abogado': [
        { name: 'Lic. Roberto Martínez', title: 'Abogado Penalista', rating: 4.9, reviews: 145, distance: '1.5km', description: 'Especialista en derecho penal y defensa criminal con más de 15 años de experiencia en casos complejos.' },
        { name: 'Lic. Ana Sánchez', title: 'Abogada Civil', rating: 4.8, reviews: 132, distance: '2.1km', description: 'Experta en derecho civil, contratos y litigios. Asesoría legal integral para particulares y empresas.' },
        { name: 'Lic. Carlos Fernández', title: 'Abogado Laboral', rating: 4.7, reviews: 98, distance: '0.9km', description: 'Especializado en derecho laboral, despidos y negociaciones colectivas. Defensa de derechos del trabajador.' },
        { name: 'Lic. Patricia Ramírez', title: 'Abogada Familiar', rating: 4.9, reviews: 167, distance: '1.8km', description: 'Especialista en derecho familiar, divorcios y custodia de menores. Más de 12 años de experiencia.' },
        { name: 'Lic. Fernando López', title: 'Abogado Corporativo', rating: 4.8, reviews: 134, distance: '2.3km', description: 'Experto en derecho corporativo, fusiones y adquisiciones. Asesoría legal para empresas.' }
      ],
      // Contadores/Asesores Fiscales
      'contador': [
        { name: 'C.P. María González', title: 'Contadora Pública', rating: 4.9, reviews: 167, distance: '1.8km', description: 'Asesoría contable y fiscal para empresas y particulares. Especialista en declaraciones y planeación fiscal.' },
        { name: 'C.P. Luis Ramírez', title: 'Asesor Fiscal', rating: 4.8, reviews: 143, distance: '2.3km', description: 'Experto en impuestos, auditorías y cumplimiento fiscal. Más de 12 años de experiencia.' },
        { name: 'C.P. Sofía Torres', title: 'Contadora', rating: 4.7, reviews: 112, distance: '1.1km', description: 'Servicios contables integrales, estados financieros y asesoría empresarial personalizada.' },
        { name: 'C.P. Roberto Sánchez', title: 'Contador Público', rating: 4.9, reviews: 178, distance: '1.5km', description: 'Especialista en contabilidad empresarial, nóminas y asesoría financiera para PYMES.' },
        { name: 'C.P. Ana Martínez', title: 'Asesora Fiscal', rating: 4.8, reviews: 145, distance: '2.0km', description: 'Experta en planeación fiscal, optimización de impuestos y cumplimiento normativo.' }
      ],
      // Fontaneros/Plomeros
      'fontanero': [
        { name: 'Carlos Méndez', title: 'Fontanero', rating: 4.9, reviews: 145, distance: '1.8km', description: 'Reparaciones e instalaciones de fontanería. Servicio rápido y profesional con más de 15 años de experiencia.' },
        { name: 'Roberto Sánchez', title: 'Plomero', rating: 4.8, reviews: 132, distance: '2.1km', description: 'Especialista en instalaciones y reparaciones de tuberías. Servicio 24/7 para emergencias.' },
        { name: 'Miguel Torres', title: 'Fontanero', rating: 4.7, reviews: 98, distance: '0.9km', description: 'Reparaciones de grifos, desagües y sistemas de agua. Trabajos garantizados y precios justos.' },
        { name: 'Fernando López', title: 'Plomero Profesional', rating: 4.9, reviews: 167, distance: '1.5km', description: 'Instalaciones completas de sistemas de fontanería. Certificado y con seguro de responsabilidad.' },
        { name: 'Javier Ramírez', title: 'Fontanero', rating: 4.8, reviews: 134, distance: '2.3km', description: 'Reparaciones urgentes y mantenimiento preventivo. Más de 10 años de experiencia en el sector.' }
      ],
      // Electricistas
      'electricista': [
        { name: 'Luis Hernández', title: 'Electricista', rating: 4.9, reviews: 178, distance: '1.5km', description: 'Instalaciones eléctricas y reparaciones. Certificado y con más de 12 años de experiencia profesional.' },
        { name: 'Roberto Martínez', title: 'Electricista', rating: 4.8, reviews: 156, distance: '2.2km', description: 'Especialista en instalaciones residenciales y comerciales. Trabajos garantizados y cumplimiento de normativas.' },
        { name: 'Carlos Fernández', title: 'Electricista Certificado', rating: 4.7, reviews: 134, distance: '1.1km', description: 'Reparaciones urgentes y mantenimiento eléctrico. Servicio rápido y profesional con precios competitivos.' },
        { name: 'Miguel Sánchez', title: 'Electricista', rating: 4.9, reviews: 189, distance: '1.8km', description: 'Instalaciones de paneles solares y sistemas eléctricos modernos. Más de 15 años de experiencia.' },
        { name: 'Fernando García', title: 'Electricista Profesional', rating: 4.8, reviews: 167, distance: '2.5km', description: 'Reparaciones de cortocircuitos, instalaciones de iluminación y cableado. Servicio 24/7.' }
      ],
      // Gimnasios (negocios)
      'fitness': [
        { name: 'Power Gym', title: 'Gimnasio', rating: 4.9, reviews: 234, distance: '0.8km', description: 'Gimnasio completo con equipos de última generación. Clases grupales, entrenadores personales y área de cardio.' },
        { name: 'FitZone', title: 'Centro de Fitness', rating: 4.8, reviews: 198, distance: '1.5km', description: 'Gimnasio moderno con piscina, sauna y clases de spinning. Membresías flexibles y horarios amplios.' },
        { name: 'Iron Strength', title: 'Gimnasio', rating: 4.7, reviews: 167, distance: '2.1km', description: 'Gimnasio especializado en levantamiento de pesas y entrenamiento funcional. Ambiente motivador y profesional.' },
        { name: 'Active Life', title: 'Centro Deportivo', rating: 4.9, reviews: 189, distance: '1.2km', description: 'Gimnasio con canchas de básquet, área de crossfit y clases de yoga. Instalaciones de primera calidad.' },
        { name: 'Fit & Go', title: 'Gimnasio', rating: 4.8, reviews: 156, distance: '2.4km', description: 'Gimnasio 24 horas con equipos modernos y entrenadores certificados. Sin contratos a largo plazo.' }
      ],
      // Tutores/Academias
      'educacion': [
        { name: 'Prof. Ana García', title: 'Tutora de Matemáticas', rating: 4.9, reviews: 145, distance: '1.5km', description: 'Clases particulares de matemáticas para todos los niveles. Más de 10 años de experiencia docente.' },
        { name: 'Prof. Carlos Ruiz', title: 'Tutor de Física', rating: 4.8, reviews: 132, distance: '2.1km', description: 'Especialista en física y química. Preparación para exámenes y apoyo escolar personalizado.' },
        { name: 'Prof. María López', title: 'Tutora de Inglés', rating: 4.7, reviews: 98, distance: '0.9km', description: 'Clases de inglés conversacional y preparación para exámenes internacionales. Metodología interactiva.' },
        { name: 'Prof. Roberto Sánchez', title: 'Tutor de Programación', rating: 4.9, reviews: 167, distance: '1.8km', description: 'Clases de programación y desarrollo web. Desde principiantes hasta nivel avanzado.' },
        { name: 'Prof. Laura Martínez', title: 'Tutora de Ciencias', rating: 4.8, reviews: 134, distance: '2.3km', description: 'Especialista en biología, química y ciencias naturales. Apoyo escolar y preparación universitaria.' }
      ],
      // Centros de Estética (negocios, no profesionales individuales)
      'estetica': [
        { name: 'Centro de Estética Bella', title: 'Centro de Estética', rating: 4.9, reviews: 234, distance: '0.8km', description: 'Tratamientos faciales, corporales y depilación láser. Tecnología avanzada y personal especializado.' },
        { name: 'Estética Premium', title: 'Centro de Estética', rating: 4.8, reviews: 198, distance: '1.5km', description: 'Centro especializado en tratamientos anti-edad y cuidado de la piel. Ambiente relajante y profesional.' },
        { name: 'Beauty Center', title: 'Centro de Estética', rating: 4.7, reviews: 167, distance: '2.1km', description: 'Tratamientos de belleza integrales, masajes y terapias de bienestar. Personal certificado.' },
        { name: 'Estética Avanzada', title: 'Centro de Estética', rating: 4.9, reviews: 189, distance: '1.2km', description: 'Centro con tecnología de última generación. Tratamientos faciales, corporales y medicina estética.' },
        { name: 'Centro de Belleza Total', title: 'Centro de Estética', rating: 4.8, reviews: 156, distance: '2.4km', description: 'Tratamientos personalizados de belleza y bienestar. Instalaciones modernas y ambiente acogedor.' }
      ],
      // Spas (negocios, no profesionales individuales)
      'spa': [
        { name: 'Spa Relajante', title: 'Spa y Bienestar', rating: 4.9, reviews: 234, distance: '0.8km', description: 'Spa completo con masajes, tratamientos faciales y jacuzzi. Ambiente tranquilo y relajante.' },
        { name: 'Wellness Spa', title: 'Spa y Bienestar', rating: 4.8, reviews: 198, distance: '1.5km', description: 'Spa de lujo con sauna, baño turco y tratamientos de aromaterapia. Experiencia de bienestar integral.' },
        { name: 'Spa Harmony', title: 'Spa y Bienestar', rating: 4.7, reviews: 167, distance: '2.1km', description: 'Masajes terapéuticos, tratamientos corporales y relajación. Personal especializado y productos naturales.' },
        { name: 'Zen Spa', title: 'Spa y Bienestar', rating: 4.9, reviews: 189, distance: '1.2km', description: 'Spa con enfoque en meditación y bienestar mental. Masajes tailandeses y tratamientos holísticos.' },
        { name: 'Spa Serenity', title: 'Spa y Bienestar', rating: 4.8, reviews: 156, distance: '2.4km', description: 'Spa completo con piscina termal, masajes y tratamientos de belleza. Escape perfecto del estrés.' }
      ],
      // Manicura y Pedicura (profesionales)
      'unas': [
        { name: 'María González', title: 'Manicurista', rating: 4.9, reviews: 203, distance: '1.1km', description: 'Especialista en esmaltado permanente, uñas acrílicas y diseños artísticos. Más de 8 años de experiencia.' },
        { name: 'Ana Martínez', title: 'Técnica en Uñas', rating: 4.8, reviews: 167, distance: '2.4km', description: 'Especialista en pedicura, tratamientos de uñas y cuidado de cutículas. Técnicas modernas y productos de calidad.' },
        { name: 'Laura Rodríguez', title: 'Manicurista Profesional', rating: 4.7, reviews: 124, distance: '1.8km', description: 'Diseños de uñas personalizados, esmaltado gel y extensiones. Ambiente acogedor y servicio personalizado.' },
        { name: 'Carmen López', title: 'Técnica en Uñas', rating: 4.9, reviews: 189, distance: '1.5km', description: 'Especialista en uñas esculpidas, nail art y tratamientos de fortalecimiento. Certificada internacionalmente.' },
        { name: 'Sofía Hernández', title: 'Manicurista', rating: 4.8, reviews: 156, distance: '2.1km', description: 'Servicios completos de manicura y pedicura. Uñas naturales y esmaltado de larga duración.' }
      ],
      'default': [
        { name: 'Dr. Ana García', title: 'Pediatra', rating: 4.9, reviews: 120, distance: '2.5km', description: 'Especialista en cuidado infantil y desarrollo temprano con más de 10 años de experiencia en hospitales públicos.' },
        { name: 'Carlos Ruiz', title: 'Fisioterapeuta', rating: 4.8, reviews: 85, distance: '1.2km', description: 'Rehabilitación deportiva y terapia manual avanzada para recuperación de lesiones musculares.' },
        { name: 'Elena Torres', title: 'Nutricionista', rating: 5.0, reviews: 200, distance: '3.8km', description: 'Planes de alimentación 100% personalizados enfocados en tu salud metabólica y bienestar.' }
      ]
    };
    
    // Determine category - check service ID first (most specific), then name
    let category = 'default';
    
    // Check service name/id for specific keywords (case insensitive)
    const serviceNameLower = (this.selectedService?.name || '').toLowerCase();
    const serviceIdLower = serviceId.toLowerCase();
    
    // Priority: Check exact service IDs first (from service-selector) - ORDER MATTERS!
    // Most specific first - 'dentista' MUST come before 'clinica'
    console.log('🟡 Checking category detection...');
    console.log('🟡 serviceIdLower:', serviceIdLower);
    console.log('🟡 serviceNameLower:', serviceNameLower);
    
    if (serviceIdLower === 'dentista' || serviceIdLower.includes('dentist') || 
        serviceNameLower.includes('dental') || serviceNameLower.includes('dentista') ||
        serviceNameLower.includes('odontolog') || serviceNameLower.includes('odontología')) {
      category = 'dentista';
      console.log('✅✅✅ DETECTED DENTISTA category!');
      console.log('✅ Match reason:', {
        exactId: serviceIdLower === 'dentista',
        includesDentist: serviceIdLower.includes('dentist'),
        nameIncludesDental: serviceNameLower.includes('dental'),
        nameIncludesDentista: serviceNameLower.includes('dentista'),
        nameIncludesOdontolog: serviceNameLower.includes('odontolog') || serviceNameLower.includes('odontología')
      });
    } else if (serviceIdLower === 'clinica' || serviceIdLower === 'medic' || 
               serviceIdLower.includes('doctor') || serviceNameLower.includes('médica') ||
               serviceNameLower.includes('clínica') || serviceNameLower.includes('médico') ||
               serviceNameLower.includes('clínica médica')) {
      category = 'medico';
      console.log('✅✅✅ DETECTED MEDICO category!');
      console.log('✅ Match reason:', {
        exactId: serviceIdLower === 'clinica',
        exactMedic: serviceIdLower === 'medic',
        includesDoctor: serviceIdLower.includes('doctor'),
        nameIncludesMedica: serviceNameLower.includes('médica'),
        nameIncludesClinica: serviceNameLower.includes('clínica'),
        nameIncludesMedico: serviceNameLower.includes('médico')
      });
    } else if (serviceIdLower === 'fisioterapia' || serviceIdLower.includes('fisio') || 
               serviceIdLower.includes('physio') || serviceNameLower.includes('fisioterapia') ||
               serviceNameLower.includes('fisio')) {
      category = 'fisioterapeuta';
    } else if (serviceIdLower === 'veterinaria' || serviceIdLower.includes('vet') ||
               serviceNameLower.includes('veterinaria') || serviceNameLower.includes('veterinario')) {
      category = 'veterinaria';
    } else if (serviceIdLower === 'peluqueria' || serviceNameLower.includes('peluquería') ||
               serviceNameLower.includes('peluquero') || serviceNameLower.includes('estilista')) {
      category = 'belleza'; // Solo peluqueros/estilistas
    } else if (serviceIdLower === 'estetica' || serviceNameLower.includes('estética') ||
               serviceNameLower.includes('centro de estética')) {
      category = 'estetica'; // Centros de estética (negocios)
    } else if (serviceIdLower === 'spa' || serviceNameLower.includes('spa') ||
               serviceNameLower.includes('bienestar')) {
      category = 'spa'; // Spas (negocios)
    } else if (serviceIdLower === 'unas' || serviceNameLower.includes('manicura') ||
               serviceNameLower.includes('pedicura') || serviceNameLower.includes('uñas')) {
      category = 'unas'; // Manicura y pedicura
    } else if (serviceIdLower === 'fontanero' || serviceNameLower.includes('fontanería') ||
               serviceNameLower.includes('plomería') || serviceNameLower.includes('plomero')) {
      category = 'fontanero';
    } else if (serviceIdLower === 'electricista' || serviceNameLower.includes('electricista') ||
               serviceNameLower.includes('eléctrico')) {
      category = 'electricista';
    } else if (serviceIdLower === 'fitness' || serviceNameLower.includes('gimnasio') ||
               serviceNameLower.includes('fitness')) {
      category = 'fitness'; // Gimnasios (negocios)
    } else if (serviceIdLower === 'educacion' || serviceIdLower === 'tutoria' ||
               serviceNameLower.includes('academia') || serviceNameLower.includes('tutoría') ||
               serviceNameLower.includes('tutorías')) {
      category = 'educacion';
    } else if (serviceIdLower === 'restaurante' || serviceIdLower === 'catering' ||
               serviceIdLower.includes('restaurant') || serviceNameLower.includes('restaurante') ||
               serviceNameLower.includes('catering')) {
      category = 'restaurante';
    } else if (serviceIdLower === 'eventos' || serviceIdLower.includes('event') ||
               serviceNameLower.includes('evento')) {
      category = 'eventos';
    } else if (serviceIdLower === 'abogado' || serviceNameLower.includes('abogado') ||
               serviceNameLower.includes('despacho') || serviceNameLower.includes('legal')) {
      category = 'abogado';
    } else if (serviceIdLower === 'contador' || serviceNameLower.includes('contador') ||
               serviceNameLower.includes('fiscal') || serviceNameLower.includes('asesoría fiscal')) {
      category = 'contador';
    }
    
    const professionals = professionalsByCategory[category] || professionalsByCategory['default'];
    const images = professionalImages[category] || professionalImages['default'];
    
    console.log('🔍 getProfessionalsForService FINAL DEBUG:', {
      serviceId: serviceIdLower,
      serviceName: serviceNameLower,
      serviceCategory: serviceCategory,
      detectedCategory: category,
      professionalsAvailable: professionals.length,
      imagesAvailable: images.length,
      professionalsList: professionals.map(p => ({ name: p.name, title: p.title })),
      categoryExists: !!professionalsByCategory[category],
      imagesExist: !!professionalImages[category]
    });
    
    if (professionals.length === 0) {
      console.error('❌ ERROR: No professionals found for category:', category);
      console.error('❌ Available categories:', Object.keys(professionalsByCategory));
    }
    
    if (images.length === 0) {
      console.error('❌ ERROR: No images found for category:', category);
      console.error('❌ Available image categories:', Object.keys(professionalImages));
    }
    
    // Ensure we return exactly 5 professionals if available
    const result = professionals.slice(0, 5).map((prof, index) => {
      const imageIndex = index % images.length;
      const assignedImage = images[imageIndex];
      console.log(`🖼️ Mapping image for ${prof.name} (index ${index}): using image[${imageIndex}] = ${assignedImage.substring(0, 60)}...`);
      return {
        ...prof,
        image: assignedImage
      };
    });
    
    console.log('✅✅✅ FINAL RESULT - Returning', result.length, 'professionals for category:', category);
    result.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - ${p.title} - Image: ${p.image.substring(0, 60)}...`);
    });
    
    // Cache the result
    this.cachedServiceId = serviceId;
    this.cachedProfessionals = result;
    
    return result;
  }

  // Get category color based on service
  getCategoryColor(): string {
    const serviceId = this.selectedService?.id?.toLowerCase() || '';
    const serviceCategory = this.selectedService?.category?.toLowerCase() || '';
    
    // Health services - Blue
    if (serviceId.includes('dentist') || serviceId.includes('dentista') || 
        serviceId.includes('clinica') || serviceId.includes('medic') ||
        serviceId.includes('fisio') || serviceId.includes('vet') ||
        serviceId.includes('veterinaria')) {
      return '#13a4ec'; // Blue
    }
    // Beauty services - Purple/Pink
    else if (serviceCategory === 'belleza' || serviceId.includes('beauty') || 
             serviceId.includes('peluqueria') || serviceId.includes('estetica') ||
             serviceId.includes('spa')) {
      return '#a855f7'; // Purple
    }
    // Restaurants - Orange
    else if (serviceId.includes('restaurant') || serviceId.includes('restaurante') ||
             serviceId.includes('catering')) {
      return '#f97316'; // Orange
    }
    // Events - Green
    else if (serviceId.includes('event') || serviceId.includes('evento')) {
      return '#10b981'; // Green
    }
    // Legal/Professional - Dark Blue
    else if (serviceId.includes('abogado') || serviceId.includes('legal') ||
             serviceId.includes('contador') || serviceId.includes('fiscal')) {
      return '#1e40af'; // Dark Blue
    }
    // Default - Blue
    return '#13a4ec';
  }

  getCategoryColorHover(): string {
    const baseColor = this.getCategoryColor();
    // Return a slightly darker version for hover
    return baseColor;
  }
  
  // Marketplace filters
  selectedCategory: string = 'todos';
  searchQuery: string = '';
  
  // All services
  allServices = [
    { id: 'health', title: 'Salud', description: 'Medicina general, dentistas y t...', icon: 'health_and_safety', color: 'green', category: 'salud' },
    { id: 'beauty', title: 'Belleza', description: 'Peluquería, manicura y tratami...', icon: 'spa', color: 'purple', category: 'belleza' },
    { id: 'automotive', title: 'Automóvil', description: 'Mantenimiento, lavado y repar...', icon: 'directions_car', color: 'blue', category: 'automovil' },
    { id: 'home', title: 'Hogar', description: 'Limpieza, fontanería y jardinería', icon: 'home', color: 'orange', category: 'hogar' },
    { id: 'pets', title: 'Mascotas', description: 'Veterinaria, paseos y cuidado', icon: 'pets', color: 'pink', category: 'mascotas' }
  ];
  
  // Updated usage methods for new flow
  onRoleSelected(role: 'professional' | 'client') {
      // Check if user is authenticated
      if (!this.authService.isAuthenticated()) {
          // Show login screen
          this.selectedRole = role;
          this.showAuthScreen = 'login';
          this.currentStep = -0.5; // Auth step
      } else {
          // User is authenticated, proceed to dashboard
          this.selectedRole = role;
          this.currentStep = 0; // Go to Marketplace
      }
  }

  onLoginSuccess() {
      this.showAuthScreen = null;
      // Check user role and go to appropriate dashboard
      const currentUser = this.authService.getCurrentUser();
      console.log('=== LOGIN SUCCESS ==');
      console.log('Current User:', currentUser);
      console.log('User Role:', currentUser?.role);
      
      if (currentUser?.role === 'professional') {
          console.log('→ Routing to Professional Dashboard (step 1)');
          this.currentStep = 1; // Professional dashboard
      } else {
          console.log('→ Routing to Client Marketplace (step 0)');
          this.currentStep = 0; // Client marketplace
      }
      console.log('Final Current Step:', this.currentStep);
      console.log('===================');
  }

  onRegisterSuccess() {
      this.showAuthScreen = null;
      // Check user role and go to appropriate dashboard
      const currentUser = this.authService.getCurrentUser();
      console.log('=== REGISTER SUCCESS ==');
      console.log('Current User:', currentUser);
      console.log('User Role:', currentUser?.role);
      console.log('Selected Role:', this.selectedRole);
      
      if (currentUser?.role === 'professional') {
          console.log('→ Routing to Professional Dashboard (step 1)');
          this.currentStep = 1; // Professional dashboard
      } else {
          console.log('→ Routing to Client Marketplace (step 0)');
          this.currentStep = 0; // Client marketplace
      }
      console.log('Final Current Step:', this.currentStep);
      console.log('=======================');
  }

  onLogout() {
      console.log('Logging out...');
      this.authService.logout();
      this.currentStep = -1; // Go back to Role Selector
      this.selectedRole = null;
      this.showAuthScreen = null;
  }

  switchToRegister() {
      this.showAuthScreen = 'register';
  }

  switchToLogin() {
      this.showAuthScreen = 'login';
  }
  
  // Category filter methods
  selectCategory(category: string) {
      this.selectedCategory = category;
  }
  
  getFilteredServices() {
      if (this.selectedCategory === 'todos') {
          return this.allServices;
      }
      return this.allServices.filter(service => service.category === this.selectedCategory);
  }
  
  onSearchChange(query: string) {
      this.searchQuery = query;
  }

  startDemo(category: string) {
      // In a real app, this would filter agents. For demo, we just launch the generic booking agent.
      // We could set a "context" if needed, e.g., 'dental' vs 'beauty'.
      // For now, simple transition to Chat.
      this.currentStep = 1;
      
      // Optional: Send a hidden system message to prime the agent context?
      // Or just let the user type.
  }

  nextStep() {
      if (this.currentStep < 4) this.currentStep++;
  }
  
  prevStep() {
      if (this.currentStep > -1) this.currentStep--;
  }

  goToStep(step: number) {
      // If going back to service selector (step 0), clear chat messages
      if (step === 0) {
        this.messages = [];
        this.exampleMessages = [];
        this.availableSlots = [];
        this.detectedDayOptions = [];
        this.selectedDayOption = null;
        this.selectedProfessional = null;
        this.selectedProfessionalData = null;
        this.showCalendarModal = false;
        this.checkingAvailability = false;
        this.interactionCount = 0;
        this.selectedService = null;
        this.cachedServiceId = null;
        this.cachedProfessionals = [];
      }
      this.currentStep = step;
  }
  
  selectProfessional(professional: { name: string; image: string; title: string; rating: number; reviews: number }) {
      this.selectedProfessional = professional.name;
      this.selectedProfessionalData = professional;
      // After selecting professional, go to chat
      this.goToStep(1); // Chat step
      // Add welcome message with professional context
      this.addWelcomeMessageWithProfessional();
  }

  onServiceSelected(service: any) {
      console.log('🔵🔵🔵 onServiceSelected CALLED with:', {
        id: service.id,
        name: service.name,
        category: service.category,
        categoryId: service.categoryId,
        categoryName: service.categoryName,
        businessType: service.businessType,
        description: service.description,
        fullService: service
      });
      
      // CLEAR ALL CHAT MESSAGES when changing service to avoid mixing conversations
      this.messages = [];
      this.exampleMessages = [];
      this.availableSlots = [];
      this.detectedDayOptions = [];
      this.selectedDayOption = null;
      this.selectedProfessional = null;
      this.selectedProfessionalData = null;
      this.showCalendarModal = false;
      this.checkingAvailability = false;
      this.interactionCount = 0;
      
      // Clear cache when service changes
      this.cachedServiceId = null;
      this.cachedProfessionals = [];
      
      // Store service info with full context - BUT PRESERVE ORIGINAL id and name
      const serviceContext = this.getServiceContext(service.id); // Pass ID, not name!
      const { id: contextId, name: contextName, ...contextWithoutIdName } = serviceContext; // Remove id and name from context
      
      this.selectedService = {
        id: service.id, // PRESERVE original id
        name: service.name, // PRESERVE original name
        description: service.description,
        category: service.category,
        categoryId: service.categoryId,
        categoryName: service.categoryName,
        businessType: service.businessType,
        ...contextWithoutIdName, // Include context WITHOUT id and name
      };
      
      console.log('🔵 selectedService SET TO:', {
        id: this.selectedService.id,
        name: this.selectedService.name,
        category: this.selectedService.category,
        categoryId: this.selectedService.categoryId,
        categoryName: this.selectedService.categoryName,
        businessType: this.selectedService.businessType,
        fullSelectedService: this.selectedService
      });
      
      // Check if it's a restaurant - different flow
      const serviceId = service.id?.toLowerCase() || '';
      console.log('🔵 serviceId.toLowerCase():', serviceId);
      
      if (serviceId.includes('restaurant') || serviceId.includes('restaurante')) {
        // Go to restaurant selection
        this.currentStep = 6; // Restaurant selection step
        console.log('🔵 Going to RESTAURANT selection (step 6)');
      } else {
        // For other services, go to professional selection
        this.currentStep = 3; // Professional selection step
        console.log('🔵 Going to PROFESSIONAL selection (step 3)');
      
        // Wait a tick for Angular change detection, then test
        this.safeSetTimeout(() => {
          const professionals = this.getProfessionalsForService();
          console.log('🔵 AFTER TIMEOUT - getProfessionalsForService returned:', professionals.length, 'professionals');
          professionals.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.name} - ${p.title}`);
          });
        }, 100);
      }
  }

  onServiceSelectorBack() {
      // If at service selector, close modal
      this.onClose();
  }

  useExample(example: string): void {
    // Clear suggestions immediately when one is selected
    this.exampleMessages = [];
    this.currentMessage = example;
    this.sendMessage();
  }

  // ... existing methods ...

  async sendMessage(): Promise<void> {
    // Include service context in the message for better AI responses
    const messageWithContext = this.currentMessage;
    
    // If we have service context, add it to help the AI
    if (this.selectedService) {
      const context = this.getServiceContext(this.selectedService.name);
      if (context) {
        // The backend will use this context to personalize responses
        console.log('Sending message with context:', context.businessType);
      }
    }
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
    
    // Increment interaction count
    this.interactionCount++;
    
    // Show lead capture after 3-5 interactions (if not already shown)
    if (this.interactionCount >= 3 && !this.showLeadCapture && !this.authService.isAuthenticated()) {
      // Show lead capture modal after response
      this.safeSetTimeout(() => {
        this.showLeadCapture = true;
      }, 1000);
    }

    const startTime = Date.now();

    try {
      let response: AgentResponse | undefined;
      switch (this.agent.id) {
        case 'booking':
          // Include service context for personalized AI responses
          const serviceContext = this.selectedService ? {
            id: this.selectedService.id,
            name: this.selectedService.name,
            businessType: this.selectedService.businessType || this.selectedService.id,
            tone: this.selectedService.tone,
          } : null;
          
          response = await this.apiService
            .processBooking(
              messageToSend,
              'demo-business',
              true,
              serviceContext,
              this.sessionId,
            )
            .toPromise();
          
          // Handle Tool Calls for Visualization and Real-time Availability
          if (response?.toolCalls && response.toolCalls.length > 0) {
              console.log('Frontend received tool calls:', response.toolCalls);
              
              for (const call of response.toolCalls) {
                  if (call.name === 'check_availability') {
                      // Parse date from args
                      const dateStr = call.args?.date || call.args || new Date().toISOString().split('T')[0];
                      this.calendarData.currentDate = new Date(dateStr);
                      
                      // Extract slots from tool result
                      // Tool calls have 'content' property with the tool's return value
                      const toolContent = (call as any).content;
                      if (toolContent) {
                        try {
                          const toolResult = JSON.parse(toolContent);
                          if (toolResult.slots && Array.isArray(toolResult.slots)) {
                            this.availableSlots = toolResult.slots;
                            this.calendarData.availableSlots = toolResult.slots;
                            console.log('Available slots extracted from tool:', this.availableSlots);
                          }
                        } catch (e) {
                          console.warn('Could not parse tool result:', e);
                        }
                      }
                      
                      // Show message that agent is checking
                      this.messages.push({
                        id: `availability_check_${Date.now()}`,
                        content: '📅 Verificando disponibilidad en tiempo real...',
                        sender: 'agent',
                        timestamp: new Date(),
                        isSystem: true,
                      } as any);
                      
                      // Check availability in real-time (backup method)
                      await this.checkAvailabilityRealTime(dateStr);
                      
                      // After checking availability, show calendar (step 2)
                      this.safeSetTimeout(() => {
                        if (this.availableSlots.length > 0) {
                          this.currentStep = 2; // Show calendar
                          console.log('Showing calendar with slots:', this.availableSlots);
                        }
                      }, 2000); // Give time for availability to load
                  }
                  
                  if (call.name === 'confirm_booking') {
                      // Extract booking details from tool result
                      const toolContent = (call as any).content;
                      if (toolContent) {
                        try {
                          const toolResult = JSON.parse(toolContent);
                          if (toolResult.bookingId) {
                            // Create booking object
                            const booking = {
                              id: toolResult.bookingId,
                              date: call.args?.date || new Date().toISOString().split('T')[0],
                              time: call.args?.time || '10:00',
                              service: this.selectedService?.name || 'Servicio',
                              professional: this.selectedProfessional || 'Profesional',
                              status: 'confirmed' as const,
                              amount: 350, // Mock amount
                              paymentStatus: 'pending' as const,
                            };
                            
                            // Add to bookings list
                            this.bookings.unshift(booking);
                            
                            // Create notification
                            this.addNotification({
                              type: 'reminder',
                              title: 'Recordatorio de Cita',
                              message: `Tu cita con ${booking.professional} es ${this.formatDate(booking.date)} a las ${booking.time}.`,
                              icon: 'event_upcoming',
                              color: 'blue',
                            });
                            
                            // Show confirmation screen (step 4)
                            this.selectedBooking = booking;
                            this.currentStep = 4;
                            return; // Exit early
                          }
                        } catch (e) {
                          console.warn('Could not parse booking confirmation:', e);
                        }
                      }
                      
                      // After booking confirmed, show professional selection (step 3) if no booking details
                      this.messages.push({
                          id: 'sys-' + Date.now(),
                          content: '✅ Reserva confirmada en el sistema.',
                          sender: 'agent',
                          timestamp: new Date(),
                          isSystem: true
                      } as any);
                      
                      this.safeSetTimeout(() => {
                        this.currentStep = 3; // Show professional selection
                      }, 1500);
                  }
              }
          }
          
          // Extract day options from message FIRST (before availability)
          if (response?.message) {
              // Always try to extract day options
              this.extractDayOptionsFromMessage(response.message);
              
              // Also check if response message contains availability info
              if (this.isAvailabilityMessage(response.message)) {
                  this.extractAvailabilityFromMessage(response.message);
                  // Show calendar modal in chat (don't change step)
                  if (this.availableSlots.length > 0 || this.detectedDayOptions.length > 0) {
                    this.safeSetTimeout(() => {
                      this.showCalendarModal = true;
                    }, 1000);
                  }
              }
          }
          break;
        case 'dm-response':
          response = await this.apiService.processDm(messageToSend).toPromise();
          // Generate contextual suggestions for dm-response agent
          if (response?.message) {
            this.safeSetTimeout(() => {
              this.generateContextualSuggestions(response!.message!);
            }, 200);
          }
          break;
        case 'follow-up':
          response = await this.apiService
            .generateFollowUp(messageToSend, 3)
            .toPromise();
          // Generate contextual suggestions for follow-up agent
          if (response?.message) {
            this.safeSetTimeout(() => {
              this.generateContextualSuggestions(response!.message!);
            }, 200);
          }
          break;
        case 'voice':
          response = await this.apiService
            .generateVoice(messageToSend, false)
            .toPromise();
          // Generate contextual suggestions for voice agent
          if (response?.message) {
            this.safeSetTimeout(() => {
              this.generateContextualSuggestions(response!.message!);
            }, 200);
          }
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
      if (response && response.audioUrl) {
        this.voiceMessage = {
          script: response.script || '',
          audioUrl: typeof response.audioUrl === 'string' ? response.audioUrl : '',
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
        
        // Generate contextual suggestions AFTER agent message is added
        // This ensures we can analyze the last agent message correctly
        if (response && response.message) {
          const agentMessageContent = response.message;
          this.safeSetTimeout(() => {
            this.generateContextualSuggestions(agentMessageContent);
          }, 300);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle connection errors
      let errorMessage = '❌ Lo siento, hubo un error procesando tu mensaje. Por favor, intenta de nuevo.';
      
      if (error?.status === 0 || 
          error?.message?.includes('ERR_CONNECTION_REFUSED') || 
          error?.message?.includes('Unknown Error') ||
          error?.error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = '⚠️ No se pudo conectar con el servidor. Por favor, asegúrate de que el backend esté corriendo en http://localhost:3000';
      } else if (error?.status === 404) {
        errorMessage = '⚠️ El endpoint no fue encontrado. Verifica la configuración del backend.';
      } else if (error?.status === 500) {
        errorMessage = '⚠️ Error en el servidor. Por favor, intenta de nuevo más tarde.';
      }
      
      this.messages.push({
        id: (Date.now() + 2).toString(),
        content: errorMessage,
        sender: 'agent',
        timestamp: new Date(),
        isSystem: true,
      } as any);
    } finally {
      this.isLoading = false;
    }
  }

  onSlotSelected(slot: string | { date: string; time: string }): void {
      if (typeof slot === 'string') {
        // Legacy format: just time string
        this.calendarData.selectedSlot = slot;
      } else {
        // New format: object with date and time
        this.calendarData.selectedSlot = slot.time;
        this.calendarData.currentDate = new Date(slot.date);
      }
      // Close calendar modal and go to payment step
      this.showCalendarModal = false;
      this.goToStep(9); // Payment step (new)
  }
  
  // Payment state
  paymentProcessing = false;
  paymentError: string | null = null;
  stripeCheckoutUrl: string | null = null;
  
  // Calculate booking price
  getBookingPrice(): number {
    // Precio fijo de 50 euros para todos los servicios
    return 50;
  }
  
  // Initialize Stripe payment
  // NOTE: Para el pago simulado NO se necesitan claves de Stripe.
  // Si quieres usar Stripe real, necesitarás:
  // - Clave pública (pk_test_...) en el frontend
  // - Clave secreta (sk_test_...) en el backend
  async initializePayment(): Promise<void> {
    this.paymentProcessing = true;
    this.paymentError = null;
    
    try {
      // Call backend to create Stripe checkout session
      const bookingData = {
        serviceId: this.selectedService?.id,
        serviceName: this.selectedService?.name,
        professionalId: this.selectedProfessional,
        professionalName: this.selectedProfessionalData?.name,
        date: this.calendarData.currentDate,
        time: this.calendarData.selectedSlot,
        amount: this.getBookingPrice(),
        restaurantId: this.selectedRestaurant?.id,
        deliveryAddress: this.deliveryAddress?.formatted_address,
      };
      
      // TODO: Para usar Stripe real, descomenta esto y configura las claves:
      // const response = await this.apiService.createBookingCheckout(bookingData);
      // this.stripeCheckoutUrl = response.checkoutUrl;
      // window.location.href = this.stripeCheckoutUrl;
      
      // PAGO SIMULADO (no requiere claves de Stripe)
      // Simula el procesamiento del pago sin hacer una llamada real
      this.safeSetTimeout(() => {
        this.processPayment();
      }, 2000);
      
    } catch (error: any) {
      this.paymentError = error.message || 'Error al procesar el pago';
      this.paymentProcessing = false;
    }
  }
  
  // Process payment (simulated for now)
  async processPayment(): Promise<void> {
    // Simulate Stripe payment processing
    this.safeSetTimeout(() => {
      this.paymentProcessing = false;
      // After successful payment, go to confirmation
      this.confirmBooking();
    }, 2000);
  }
  
  // Handle payment success (called from Stripe redirect or after simulation)
  onPaymentSuccess(): void {
    this.confirmBooking();
  }
  
  // Call n8n webhook after successful booking
  async callN8nWebhook(booking: any): Promise<void> {
    try {
      // TODO: Replace with actual n8n webhook URL from environment
      const n8nWebhookUrl = 'https://your-n8n-instance.com/webhook/booking-confirmed';
      
      const webhookData = {
        bookingId: booking.id,
        service: booking.service,
        professional: booking.professional,
        date: booking.date,
        time: booking.time,
        amount: booking.amount,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        timestamp: new Date().toISOString(),
        // Additional data
        restaurant: this.selectedRestaurant?.name,
        deliveryAddress: this.deliveryAddress?.formatted_address,
        menuType: this.selectedMenuType,
      };
      
      // Uncomment when n8n webhook is configured
      // await fetch(n8nWebhookUrl, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(webhookData),
      // });
      
      console.log('📡 N8N Webhook data (ready to send):', webhookData);
    } catch (error) {
      console.error('Error calling n8n webhook:', error);
      // Don't block the flow if webhook fails
    }
  }

  openCalendarModal(): void {
      this.showCalendarModal = true;
  }
  
  // Navigation methods
  navigateToTab(tab: 'inicio' | 'reservas' | 'avisos' | 'perfil'): void {
    this.activeTab = tab;
    if (tab === 'reservas') {
      this.currentStep = 10; // Reservas view
    } else if (tab === 'avisos') {
      this.currentStep = 11; // Avisos view
    } else if (tab === 'inicio') {
      this.currentStep = 0; // Service selector
    }
  }
  
  // Booking management
  cancelBookingById(bookingId: string): void {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'cancelled';
      this.addNotification({
        type: 'action',
        title: 'Cita Cancelada',
        message: `Tu cita del ${this.formatDate(booking.date)} ha sido cancelada.`,
        icon: 'cancel',
        color: 'orange',
      });
    }
  }
  
  deleteBooking(bookingId: string): void {
    this.bookings = this.bookings.filter(b => b.id !== bookingId);
  }
  
  // Notifications
  addNotification(notification: {
    type: 'reminder' | 'payment' | 'action' | 'offer' | 'message' | 'security';
    title: string;
    message: string;
    icon: string;
    color: string;
  }): void {
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      ...notification,
      timestamp: new Date(),
      read: false,
    });
  }
  
  markNotificationAsRead(notificationId: string): void {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }
  }
  
  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }
  
  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
  
  // Payment simulation
  async processTestPayment(bookingId: string, amount: number): Promise<boolean> {
    // Simulate payment processing
    return new Promise((resolve) => {
      this.safeSetTimeout(() => {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (booking) {
          booking.paymentStatus = 'paid';
          this.addNotification({
            type: 'payment',
            title: 'Pago Confirmado',
            message: `Hemos recibido el pago de $${amount.toFixed(2)} MXN exitosamente.`,
            icon: 'check_circle',
            color: 'green',
          });
        }
        resolve(true);
      }, 2000); // Simulate 2 second payment processing
    });
  }
  
  // Utility
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  }
  
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  
  getEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = (hours + 1) % 24;
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  async addToCalendar(): Promise<void> {
    try {
      // Get current booking data
      const bookingDate = this.calendarData.currentDate;
      const bookingTime = this.calendarData.selectedSlot || '10:00';
      const serviceName = this.selectedService?.name || 'Servicio';
      const professionalName = this.selectedProfessional || this.selectedProfessionalData?.name || 'Profesional';
      const location = this.selectedRestaurant?.name || this.selectedService?.name || 'Ubicación';
      
      // Parse time
      const timeParts = bookingTime.split(':');
      const startHour = parseInt(timeParts[0]);
      const startMin = parseInt(timeParts[1]);
      
      // Create start and end dates
      const startDate = new Date(bookingDate);
      startDate.setHours(startHour, startMin, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(startHour + 1, startMin, 0, 0); // 1 hour duration
      
      // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
      };
      
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);
      
      // Create Google Calendar URL
      const calendarTitle = encodeURIComponent(`Cita: ${serviceName} con ${professionalName}`);
      const calendarDetails = encodeURIComponent(
        `Servicio: ${serviceName}\n` +
        `Profesional: ${professionalName}\n` +
        `Precio: €${this.getBookingPrice()}.00\n` +
        (this.selectedRestaurant ? `Restaurante: ${this.selectedRestaurant.name}\n` : '') +
        (this.deliveryAddress ? `Dirección de entrega: ${this.deliveryAddress.formatted_address}\n` : '')
      );
      const calendarLocation = encodeURIComponent(location);
      
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&dates=${startDateStr}/${endDateStr}&details=${calendarDetails}&location=${calendarLocation}`;
      
      // Open Google Calendar in new tab
      window.open(googleCalendarUrl, '_blank');
      
      // Find the current booking to send to webhook
      const currentBooking = this.bookings.find(b => 
        b.date === bookingDate.toISOString().split('T')[0] &&
        b.time === bookingTime
      ) || {
        id: `booking_${Date.now()}`,
        date: bookingDate.toISOString().split('T')[0],
        time: bookingTime,
        service: serviceName,
        professional: professionalName,
        status: 'confirmed' as const,
        amount: this.getBookingPrice(),
        paymentStatus: 'paid' as const,
      };
      
      // Call n8n webhook when adding to calendar
      await this.callN8nWebhook(currentBooking);
      
      // Show success message
      this.addNotification({
        type: 'action',
        title: 'Añadido a Calendario',
        message: 'El evento se ha añadido a tu Google Calendar. El webhook de n8n ha sido activado.',
        icon: 'check_circle',
        color: 'green',
      });
    } catch (error) {
      console.error('Error adding to calendar:', error);
      this.addNotification({
        type: 'action',
        title: 'Error',
        message: 'No se pudo añadir al calendario. Por favor, inténtalo de nuevo.',
        icon: 'error',
        color: 'red',
      });
    }
  }
  
  reagendarBooking(bookingId: string): void {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      this.selectedBooking = booking;
      this.currentStep = 2; // Go to calendar
    }
  }
  
  // Reschedule current booking - go to calendar to select new date
  rescheduleBooking(): void {
    // Go to calendar step to select a new date
    this.goToStep(2);
  }
  
  // Cancel current booking
  cancelBooking(): void {
    const bookingDate = this.calendarData.currentDate;
    const bookingTime = this.calendarData.selectedSlot || '10:00';
    
    // Find and remove the booking
    const bookingIndex = this.bookings.findIndex(b => 
      b.date === bookingDate.toISOString().split('T')[0] &&
      b.time === bookingTime
    );
    
    if (bookingIndex !== -1) {
      const cancelledBooking = this.bookings[bookingIndex];
      this.bookings.splice(bookingIndex, 1);
      
      // Show cancellation notification
      this.addNotification({
        type: 'action',
        title: 'Cita Cancelada',
        message: `Tu cita del ${this.formatDate(cancelledBooking.date)} a las ${cancelledBooking.time} ha sido cancelada.`,
        icon: 'cancel',
        color: 'orange',
      });
    }
    
    // Reset and go back to service selection
    this.goToStep(0);
    this.calendarData.selectedSlot = null;
  }
  
  viewBookingDetails(booking: any): void {
    this.selectedBooking = booking;
    this.currentStep = 4; // Show confirmation/details view
  }
  
  getNotificationGroups(): Array<{ label: string; notifications: any[] }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const groups: Array<{ label: string; notifications: any[] }> = [];
    
    const todayNotifs = this.notifications.filter(n => {
      const notifDate = new Date(n.timestamp);
      return notifDate >= today;
    });
    if (todayNotifs.length > 0) {
      groups.push({ label: 'Hoy', notifications: todayNotifs });
    }
    
    const yesterdayNotifs = this.notifications.filter(n => {
      const notifDate = new Date(n.timestamp);
      return notifDate >= yesterday && notifDate < today;
    });
    if (yesterdayNotifs.length > 0) {
      groups.push({ label: 'Ayer', notifications: yesterdayNotifs });
    }
    
    const weekNotifs = this.notifications.filter(n => {
      const notifDate = new Date(n.timestamp);
      return notifDate >= weekAgo && notifDate < yesterday;
    });
    if (weekNotifs.length > 0) {
      groups.push({ label: 'Esta Semana', notifications: weekNotifs });
    }
    
    return groups;
  }

  onCheckAvailability(date: Date) {
      this.messages.push({
          id: 'sys-' + Date.now(),
          content: '📅 Consultando disponibilidad en el calendario...',
          sender: 'agent',
          timestamp: new Date(),
          isSystem: true
      } as any);
      
      // Simulate Backend Delay
      this.safeSetTimeout(() => {
          this.calendarData.currentDate = date;
           
           this.messages.push({
              id: (Date.now() + 1).toString(),
              content: `He revisado la disponibilidad para el ${date.toLocaleDateString()}. Por favor, selecciona un hueco verde para reservar.`,
              sender: 'agent',
              timestamp: new Date()
            });
      }, 1000);
  }

  onClose(): void {
    this.close.emit();
  }

  confirmBooking(): void {
    // Create booking entry
    const bookingDate = this.calendarData.currentDate;
    const bookingTime = this.calendarData.selectedSlot || '10:00';
    const bookingPrice = this.getBookingPrice();
    
    const newBooking = {
      id: `booking_${Date.now()}`,
      date: bookingDate.toISOString().split('T')[0],
      time: bookingTime,
      service: this.selectedService?.name || 'Servicio',
      professional: this.selectedProfessional || 'Profesional Asignado',
      status: 'confirmed' as const,
      amount: bookingPrice,
      paymentStatus: 'paid' as const,
    };
    
    this.bookings.push(newBooking);
    
    // Don't call n8n webhook here - it will be called when user adds to calendar
    // The webhook should be triggered when the user explicitly adds the event to their calendar
    
    // Go to confirmation screen (step 4)
    this.currentStep = 4;
    
    // Add notification
    this.addNotification({
      type: 'action',
      title: 'Cita Confirmada',
      message: `Tu cita con ${this.selectedProfessional || 'el profesional'} ha sido confirmada para el ${this.formatDate(newBooking.date)} a las ${bookingTime}.`,
      icon: 'check_circle',
      color: 'green',
    });
  }

  onSuccessClose(): void {
    // Reset and close
    this.showSuccessMessage = false;
    this.currentStep = 0;
    this.selectedService = null;
    this.selectedProfessional = null;
    this.selectedProfessionalData = null;
    this.calendarData.selectedSlot = null;
    this.onClose();
  }

  getProfessionalAltText(): string {
    if (this.selectedProfessionalData?.name) {
      return `${this.selectedProfessionalData.name} profile`;
    }
    if (this.selectedProfessional) {
      return `${this.selectedProfessional} profile`;
    }
    return 'Profesional profile';
  }

  // Restaurant flow methods
  selectRestaurant(restaurant: { id: string; name: string; image: string; rating: number; reviews: number }): void {
    this.selectedRestaurant = restaurant;
    // Go to menu selection
    this.currentStep = 7; // Menu selection step
  }

  selectMenuType(menuType: string): void {
    this.selectedMenuType = menuType;
    // Go to chat to choose dine-in or delivery
    this.currentStep = 1; // Chat step
    // Add welcome message for restaurant
    this.addRestaurantWelcomeMessage();
  }

  addRestaurantWelcomeMessage(): void {
    const restaurantName = this.selectedRestaurant?.name || 'el restaurante';
    const menuType = this.selectedMenuType || 'menú';
    
    const welcomeMessage = `¡Perfecto! Has seleccionado ${restaurantName} con ${menuType}. ¿Te gustaría comer aquí en el restaurante o prefieres pedir a domicilio?`;
    
    this.messages.push({
      id: 'welcome-restaurant',
      content: welcomeMessage,
      sender: 'agent',
      timestamp: new Date(),
    });
  }

  selectDeliveryOption(option: 'dine-in' | 'delivery'): void {
    this.deliveryOption = option;
    
    if (option === 'delivery') {
      // Go to address selection
      this.currentStep = 8; // Delivery address step
    } else {
      // For dine-in, go to calendar to select time
      this.currentStep = 2; // Calendar step
    }
  }

  onAddressSelected(place: any): void {
    if (place) {
      this.deliveryAddress = place;
      // After selecting address, go to calendar for delivery time
      this.currentStep = 2; // Calendar step
    }
  }

  // Get restaurants list (imágenes diferentes y de mejor calidad - interiores de restaurantes)
  getRestaurants(): Array<{ id: string; name: string; image: string; rating: number; reviews: number; cuisine: string; distance: string }> {
    return [
      {
        id: 'restaurant-1',
        name: 'La Trattoria Italiana',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=90',
        rating: 4.8,
        reviews: 234,
        cuisine: 'Italiana',
        distance: '0.8km'
      },
      {
        id: 'restaurant-2',
        name: 'Sushi Master',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=90',
        rating: 4.9,
        reviews: 189,
        cuisine: 'Japonesa',
        distance: '1.2km'
      },
      {
        id: 'restaurant-3',
        name: 'El Asador',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=90',
        rating: 4.7,
        reviews: 156,
        cuisine: 'Mexicana',
        distance: '1.5km'
      }
    ];
  }

  // Get menu types for selected restaurant
  getSelectedMenuTypeName(): string {
    if (!this.selectedMenuType) {
      return 'Menú';
    }
    const menuType = this.getMenuTypes().find(m => m.id === this.selectedMenuType);
    return menuType?.name || 'Menú';
  }

  getMenuTypes(): Array<{ id: string; name: string; description: string; icon: string }> {
    return [
      { id: 'breakfast', name: 'Desayuno', description: '7:00 AM - 11:00 AM', icon: 'breakfast_dining' },
      { id: 'lunch', name: 'Comida', description: '1:00 PM - 4:00 PM', icon: 'lunch_dining' },
      { id: 'dinner', name: 'Cena', description: '7:00 PM - 11:00 PM', icon: 'dinner_dining' },
      { id: 'brunch', name: 'Brunch', description: '10:00 AM - 2:00 PM', icon: 'brunch_dining' }
    ];
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  
  /**
   * Capture lead after demo
   */
  async captureLead(): Promise<void> {
    if (!this.leadEmail || !this.leadName) return;
    
    try {
      const result = await this.apiService.captureLead(
        this.leadEmail,
        this.leadName,
        this.agent.id,
      ).toPromise();
      
      if (result?.success) {
        // Close lead capture modal
        this.showLeadCapture = false;
        
        // Show success message with API key (only shown once)
        const message = result.apiKey
          ? `¡Gracias ${this.leadName}! Tu API Key es: ${result.apiKey}\n\nGuárdala bien, solo se muestra una vez.`
          : `¡Gracias ${this.leadName}! Te hemos enviado tu API Key a ${this.leadEmail}`;
        
        alert(message);
        
        // Redirect to professional dashboard
        if (result.dashboardUrl) {
          window.location.href = result.dashboardUrl;
        } else {
          this.router.navigate(['/professional']);
        }
      } else {
        alert('Hubo un error. Por favor, intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error capturing lead:', error);
      alert('Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.');
    }
  }
  
  /**
   * Check availability in real-time (called when agent uses check_availability tool)
   */
  async checkAvailabilityRealTime(date: string): Promise<void> {
    this.checkingAvailability = true;
    
    try {
      // The agent already checked availability via tool, so we extract from the tool result
      // For demo, we'll simulate getting slots from the agent's response
      // In production, this would come from the tool result
      
      // Simulate availability slots (in real app, these come from the tool)
      const mockSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
      this.availableSlots = mockSlots;
      
      // Update calendar data
      this.calendarData.currentDate = new Date(date);
      this.calendarData.availableSlots = mockSlots;
      
      console.log(`Availability checked for ${date}: ${mockSlots.length} slots found`);
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      this.checkingAvailability = false;
    }
  }
  
  /**
   * Check if message contains availability information
   */
  private isAvailabilityMessage(message: string): boolean {
    return message.toLowerCase().includes('disponible') || 
           message.toLowerCase().includes('slots') ||
           message.toLowerCase().includes('horarios');
  }
  
  /**
   * Generate contextual suggestions based on agent's question
   */
  private generateContextualSuggestions(agentMessage: string): void {
    const message = agentMessage.toLowerCase();
    
    // If day options are already detected, don't show text suggestions
    // (day buttons will be shown instead)
    if (this.detectedDayOptions.length > 0) {
      this.exampleMessages = [];
      return;
    }
    
    // Get the last agent message to analyze
    const lastAgentMessage = this.messages
      .filter(m => m.sender === 'agent' && !m.isSystem)
      .slice(-1)[0];
    
    if (!lastAgentMessage) {
      // No agent message yet, use default examples
      this.exampleMessages = this.getExamples();
      return;
    }
    
    const lastMessage = lastAgentMessage.content.toLowerCase();
    
    // Check for "this week or next week" question
    if ((lastMessage.includes('esta semana') && lastMessage.includes('próxima semana')) || 
        (lastMessage.includes('esta semana') && lastMessage.includes('siguiente semana')) ||
        (lastMessage.includes('esta semana') && lastMessage.includes('siguiente'))) {
      this.exampleMessages = ['Esta semana', 'Próxima semana', 'Siguiente semana'];
      return;
    }
    
    // Check for "this week" question
    if (lastMessage.includes('esta semana') && !lastMessage.includes('próxima') && !lastMessage.includes('siguiente')) {
      this.exampleMessages = ['Sí, esta semana', 'Esta semana', 'Sí'];
      return;
    }
    
    // Check for "next week" question
    if (lastMessage.includes('próxima semana') || lastMessage.includes('siguiente semana')) {
      this.exampleMessages = ['Próxima semana', 'Sí', 'La próxima'];
      return;
    }
    
    // Check for time preference (morning/afternoon/evening)
    if ((lastMessage.includes('mañana') && lastMessage.includes('tarde')) || 
        (lastMessage.includes('horario') && (lastMessage.includes('prefieres') || lastMessage.includes('prefiere')))) {
      this.exampleMessages = ['Mañana', 'Tarde', 'Noche'];
      return;
    }
    
    // Check for morning question (time of day, not "tomorrow")
    if (lastMessage.includes('mañana') && !lastMessage.includes('día') && 
        !lastMessage.includes('jueves') && !lastMessage.includes('viernes') && 
        !lastMessage.includes('sábado') && !lastMessage.includes('domingo') &&
        !lastMessage.includes('lunes') && !lastMessage.includes('martes') && !lastMessage.includes('miércoles')) {
      this.exampleMessages = ['Mañana', 'Sí', 'Por la mañana'];
      return;
    }
    
    // Check for afternoon question
    if (lastMessage.includes('tarde') && !lastMessage.includes('pasado')) {
      this.exampleMessages = ['Tarde', 'Sí', 'Por la tarde'];
      return;
    }
    
    // Check for service selection question
    if (lastMessage.includes('servicio') || lastMessage.includes('qué servicio') || lastMessage.includes('qué tratamiento')) {
      if (this.selectedService) {
        const serviceId = this.selectedService.id?.toLowerCase();
        const serviceSuggestions: Record<string, string[]> = {
          'clinica': ['Consulta general', 'Consulta especializada', 'Revisión médica'],
          'dentista': ['Limpieza dental', 'Consulta', 'Tratamiento'],
          'peluqueria': ['Corte de pelo', 'Peinado', 'Coloración'],
          'estetica': ['Tratamiento facial', 'Depilación', 'Manicura'],
        };
        if (serviceSuggestions[serviceId]) {
          this.exampleMessages = serviceSuggestions[serviceId];
          return;
        }
      }
    }
    
    // Check for confirmation question (yes/no)
    if (lastMessage.includes('te parece bien') || lastMessage.includes('te gustaría') || 
        lastMessage.includes('quieres') || lastMessage.includes('te viene bien') ||
        lastMessage.includes('¿te parece') || lastMessage.includes('¿te gusta')) {
      this.exampleMessages = ['Sí, perfecto', 'Sí', 'Confirmar'];
      return;
    }
    
    // Default: use service-specific examples if available
    this.exampleMessages = this.getExamples();
  }

  /**
   * Extract day options from agent message (mañana, jueves, viernes, etc.)
   */
  private extractDayOptionsFromMessage(message: string): void {
    const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const today = new Date();
    const options: Array<{day: string, date: Date, label: string}> = [];
    
    // Improved pattern to match day mentions - more flexible
    // Matches: "mañana", "jueves", "viernes", "sábado", "el jueves", "mañana (jueves)", etc.
    const dayPattern = /(mañana\s*\([^)]+\)|mañana|pasado\s+mañana|el\s+(lunes|martes|miércoles|jueves|viernes|sábado|domingo)|(lunes|martes|miércoles|jueves|viernes|sábado|domingo))/gi;
    const matches = message.match(dayPattern);
    
    if (matches) {
      const uniqueMatches = [...new Set(matches)]; // Remove duplicates
      
      uniqueMatches.forEach(match => {
        const lowerMatch = match.toLowerCase().trim();
        let targetDate: Date | null = null;
        let label = match.trim();
        
        // Check for "mañana" (with or without day in parentheses)
        if (lowerMatch.includes('mañana')) {
          if (lowerMatch.includes('pasado')) {
            // "pasado mañana"
            targetDate = new Date(today);
            targetDate.setDate(today.getDate() + 2);
            label = `Pasado mañana (${daysOfWeek[targetDate.getDay()]})`;
          } else {
            // "mañana" or "mañana (jueves)"
            targetDate = new Date(today);
            targetDate.setDate(today.getDate() + 1);
            // Extract day from parentheses if present
            const dayMatch = lowerMatch.match(/\(([^)]+)\)/);
            if (dayMatch) {
              label = `Mañana (${dayMatch[1]})`;
            } else {
              label = `Mañana (${daysOfWeek[targetDate.getDay()]})`;
            }
          }
        } else {
          // Find day of week (lunes, martes, etc.)
          const dayIndex = daysOfWeek.findIndex(day => lowerMatch.includes(day));
          if (dayIndex !== -1) {
            const targetDay = dayIndex;
            const currentDay = today.getDay();
            let daysToAdd = targetDay - currentDay;
            if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
            targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysToAdd);
            label = daysOfWeek[targetDay].charAt(0).toUpperCase() + daysOfWeek[targetDay].slice(1);
          }
        }
        
        if (targetDate && !options.find(opt => opt.date.getTime() === targetDate!.getTime())) {
          options.push({
            day: daysOfWeek[targetDate.getDay()],
            date: targetDate,
            label: label
          });
        }
      });
    }
    
    // Sort by date
    options.sort((a, b) => a.date.getTime() - b.date.getTime());
    this.detectedDayOptions = options.slice(0, 3); // Max 3 options
    
    // Debug log
    if (this.detectedDayOptions.length > 0) {
      console.log('Detected day options:', this.detectedDayOptions);
    }
  }

  /**
   * Select a day option and check availability
   */
  async onDayOptionSelected(option: {day: string, date: Date, label: string}): Promise<void> {
    this.selectedDayOption = option;
    this.detectedDayOptions = []; // Clear options after selection
    
    // Update calendar to show selected date
    this.calendarData.currentDate = option.date;
    
    // Add user message to chat
    const userMessage = `Perfecto, quiero el ${option.label.toLowerCase()}`;
    this.messages.push({
      id: Date.now().toString(),
      content: userMessage,
      sender: 'user',
      timestamp: new Date(),
    });
    
    // Send message to agent with selected day
    this.currentMessage = userMessage;
    await this.sendMessage();
    
    // The agent will check availability and we'll extract slots from the response
    // The calendar will be shown automatically when slots are detected
  }

  /**
   * Extract availability slots from agent message
   */
  private extractAvailabilityFromMessage(message: string): void {
    // Try to extract time patterns (HH:MM)
    const timePattern = /\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\b/g;
    const matches = message.match(timePattern);
    
    if (matches && matches.length > 0) {
      this.availableSlots = [...new Set(matches)]; // Remove duplicates
    }
  }

  
  /**
   * Select a time slot (user clicks on available slot in calendar)
   */
  async selectTimeSlot(slot: string): Promise<void> {
    // Send message to agent confirming the selected slot
    const selectedDate = this.calendarData.currentDate.toISOString().split('T')[0];
    this.currentMessage = `Perfecto, quiero reservar el ${selectedDate} a las ${slot}`;
    
    // Add user message to chat
    this.messages.push({
      id: Date.now().toString(),
      content: this.currentMessage,
      sender: 'user',
      timestamp: new Date(),
    });
    
    // Send to agent
    await this.sendMessage();
    
    // Go back to chat to see agent's response
    this.currentStep = 1;
  }

  ngOnDestroy(): void {
    // Clear all pending timeouts to prevent memory leaks
    this.timeouts.forEach(timeout => window.clearTimeout(timeout));
    this.timeouts = [];
  }

  // Helper method to safely create timeouts that will be cleaned up
  private safeSetTimeout(callback: () => void, delay: number): number {
    const timeout = window.setTimeout(() => {
      callback();
      // Remove from array after execution
      const index = this.timeouts.indexOf(timeout);
      if (index > -1) {
        this.timeouts.splice(index, 1);
      }
    }, delay);
    this.timeouts.push(timeout);
    return timeout;
  }
  
}

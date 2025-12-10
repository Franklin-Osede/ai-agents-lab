import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Agent, AgentResponse } from '../../models/agent.model';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage } from '../../models/agent.model';
import { Router } from '@angular/router';

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
  
  // Lead capture
  leadEmail = '';
  leadName = '';
  
  // Steps: 0 = Service Selector, 1 = Chat, 2 = Calendar, 3 = Professional, 4 = Confirmation
  // 10 = Reservas, 11 = Avisos
  currentStep: number = 0;
  
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
  ) {}

  ngOnInit(): void {
    console.log('DemoModalComponent ngOnInit - agent:', this.agent);
    if (!this.agent) {
      console.error('No agent provided to DemoModalComponent!');
      return;
    }
    this.setupAgentSpecificContent();
    // For demo: start at service selector (step 0), then go to chat (step 1)
    this.currentStep = 0 as number; // Service selector step
    console.log('DemoModalComponent initialized - currentStep:', this.currentStep);
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
  
  /**
   * Get service-specific context for natural conversation
   */
  private getServiceContext(serviceName?: string): any {
    const serviceId = (serviceName || this.selectedService?.id || '').toLowerCase();
    
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
      return contexts[serviceId];
    }
    
    // Try to find by partial match
    for (const [key, context] of Object.entries(contexts)) {
      if (serviceId.includes(key) || key.includes(serviceId)) {
        return context;
      }
    }
    
    // If service has businessType, use it
    if (this.selectedService?.businessType) {
      const businessType = this.selectedService.businessType.toLowerCase();
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
  selectedRole: 'professional' | 'client' | null = null;
  showAuthScreen: 'login' | 'register' | null = null;
  
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
      this.currentStep = step;
  }
  
  selectProfessional(name: string) {
      this.selectedProfessional = name;
      this.goToStep(3.5); // Go to Service Selection
  }

  onServiceSelected(service: any) {
      console.log('Service selected:', service);
      // Store service info with full context
      const serviceContext = this.getServiceContext(service.name);
      this.selectedService = {
        id: service.id,
        name: service.name,
        description: service.description,
        ...serviceContext, // Include context (businessType, tone, etc.)
      };
      
      // After selecting service, go to chat
      this.currentStep = 1; // Chat step
      console.log('Moving to chat - currentStep:', this.currentStep);
      
      // Add natural welcome message with service context
      this.addWelcomeMessage(service.name);
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
      setTimeout(() => {
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
          
          response = await this.apiService.processBooking(messageToSend, 'demo-business', true, serviceContext).toPromise();
          
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
                      setTimeout(() => {
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
                      
                      setTimeout(() => {
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
                  // Show calendar after extracting availability (only if no day options)
                  if (this.detectedDayOptions.length === 0) {
                    setTimeout(() => {
                      if (this.availableSlots.length > 0) {
                        this.currentStep = 2; // Show calendar
                      }
                    }, 1000);
                  }
              }
          }
          break;
        case 'dm-response':
          response = await this.apiService.processDm(messageToSend).toPromise();
          // Generate contextual suggestions for dm-response agent
          if (response?.message) {
            setTimeout(() => {
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
            setTimeout(() => {
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
            setTimeout(() => {
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
          setTimeout(() => {
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
        this.currentMessage = `Reservar para las ${slot.split(' ')[1] || slot}`;
        // Advance to Professional Selection
        this.goToStep(3);
      } else {
        // New format: object with date and time
        this.selectTimeSlot(slot.time);
      }
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
  cancelBooking(bookingId: string): void {
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
      setTimeout(() => {
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
  
  addToCalendar(): void {
    // Simulate adding to calendar
    alert('Añadido a tu calendario');
  }
  
  reagendarBooking(bookingId: string): void {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      this.selectedBooking = booking;
      this.currentStep = 2; // Go to calendar
    }
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
      setTimeout(() => {
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
  
}


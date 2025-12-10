import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Agent } from '../../models/agent.model';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
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

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.setupAgentSpecificContent();
    this.addWelcomeMessage();
  }

  getExamples(): string[] {
    const examples: Record<string, string[]> = {
      booking: [
        'Quiero agendar una cita esta semana',
        '¿Qué precio tiene el corte de pelo?',
        '¿Tenéis disponibilidad mañana por la tarde?'
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

  calendarData = {
    currentDate: new Date(),
    availableSlots: [] as string[],
    selectedSlot: null as string | null
  };

  // Wizard State
  currentStep = -1; // Starts at Role Selector
  selectedProfessional: string | null = null;
  selectedRole: 'professional' | 'client' | null = null;
  selectedService: any = null;
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
      this.selectedService = service;
      this.goToStep(4); // Go to Confirmation
  }

  onServiceSelectorBack() {
      this.goToStep(3); // Back to Professional Selection
  }

  useExample(example: string): void {
    this.currentMessage = example;
    this.sendMessage();
  }

  // ... existing methods ...

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
          
          // Handle Tool Calls for Visualization
          if (response?.toolCalls) {
              console.log('Frontend received tool calls:', response.toolCalls);
              
              for (const call of response.toolCalls) {
                  if (call.name === 'check_availability') {
                      // Parse date from args
                      const dateStr = call.args.date || new Date().toISOString();
                      this.calendarData.currentDate = new Date(dateStr);
                      // Since backend mock is random, we simulate availability here for visualization
                      // In a real app, backend should return the data found.
                      this.calendarData.availableSlots = ['10:00', '11:00', '14:30', '16:00']; 
                      // Add a system message to show "Thinking..."
                      this.messages.push({
                          id: 'sys-' + Date.now(),
                          content: '📅 Checking calendar for availability...',
                          sender: 'agent',
                          timestamp: new Date(),
                          isSystem: true
                      } as any);
                  }
                  
                  if (call.name === 'confirm_booking') {
                      this.messages.push({
                          id: 'sys-' + Date.now(),
                          content: '✅ Booking confirmed in system.',
                          sender: 'agent',
                          timestamp: new Date(),
                          isSystem: true
                      } as any);
                  }
              }
          }
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

  onSlotSelected(slot: string): void {
      this.calendarData.selectedSlot = slot;
      this.currentMessage = `Reservar para las ${slot.split(' ')[1]}`;
      // Advance to Professional Selection
      this.goToStep(3);
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
}


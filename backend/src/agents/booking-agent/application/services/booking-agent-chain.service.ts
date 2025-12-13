import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
import { LangChainProvider } from '../../../../core/infrastructure/ai/langchain.provider';
import { checkAvailabilityTool } from '../tools/check-availability.tool';
import { SuggestTimesTool } from '../tools/suggest-times.tool';
import { confirmBookingTool } from '../tools/confirm-booking.tool';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

/**
 * BookingAgentChainService
 *
 * LangChain-based agent chain for booking agent with tools and memory.
 * Uses ReAct agent pattern for reasoning and acting.
 */
@Injectable()
export class BookingAgentChainService {
  private readonly logger = new Logger(BookingAgentChainService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private agentExecutor: any = null;
  private readonly memories: Map<string, InMemoryChatMessageHistory> = new Map();

  constructor(
    private readonly langChainProvider: LangChainProvider,
    private readonly suggestTimesTool: SuggestTimesTool,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get business context for personalized prompts
   */
  private getBusinessContext(businessType?: string): {
    name: string;
    tone: string;
    services: string;
  } {
    if (!businessType) {
      return {
        name: 'nuestro negocio',
        tone: 'amigable y profesional',
        services: 'servicios',
      };
    }

    const businessTypeLower = businessType.toLowerCase();

    // Define base contexts first
    const baseContexts: Record<string, { name: string; tone: string; services: string }> = {
      salud: {
        name: 'nuestra clínica médica',
        tone: 'profesional, empático y tranquilizador',
        services: 'consultas médicas, exámenes, seguimientos',
      },
      belleza: {
        name: 'nuestro salón de belleza',
        tone: 'amigable, acogedor y entusiasta',
        services: 'cortes de pelo, coloración, manicura, tratamientos estéticos',
      },
      dentista: {
        name: 'nuestra clínica dental',
        tone: 'profesional, tranquilizador y comprensivo',
        services: 'limpiezas dentales, consultas, tratamientos',
      },
      restaurante: {
        name: 'nuestro restaurante',
        tone: 'cordial, profesional y acogedor',
        services: 'reservas de mesa, eventos, cenas especiales',
      },
      fitness: {
        name: 'nuestro gimnasio',
        tone: 'motivador, energético y positivo',
        services: 'clases grupales, entrenadores personales, uso de equipos',
      },
      profesional: {
        name: 'nuestro despacho',
        tone: 'profesional, formal y confiable',
        services: 'consultas, asesorías, servicios profesionales',
      },
      servicio: {
        name: 'nuestro servicio',
        tone: 'práctico, eficiente y profesional',
        services: 'reparaciones, instalaciones, servicios técnicos',
      },
      educacion: {
        name: 'nuestra academia',
        tone: 'educativo, paciente y motivador',
        services: 'clases, tutorías, cursos',
      },
    };

    // Add fallbacks for variations
    const contexts: Record<string, { name: string; tone: string; services: string }> = {
      ...baseContexts,
      'clínica médica': baseContexts['salud'],
      'salón de belleza': baseContexts['belleza'],
      'clínica dental': baseContexts['dentista'],
      gimnasio: baseContexts['fitness'],
      despacho: baseContexts['profesional'],
      taller: baseContexts['servicio'],
      academia: baseContexts['educacion'],
    };

    // Try to find exact match first
    if (contexts[businessTypeLower]) {
      return contexts[businessTypeLower];
    }

    // Try to find partial match
    for (const [key, context] of Object.entries(contexts)) {
      if (businessTypeLower.includes(key) || key.includes(businessTypeLower)) {
        return context;
      }
    }

    // Default
    return {
      name: 'nuestro negocio',
      tone: 'amigable y profesional',
      services: 'servicios',
    };
  }

  /**
   * Initialize the agent executor with tools
   * Called lazily on first use
   */
  private async initializeAgent(context?: { businessType?: string }): Promise<void> {
    // Create unique key for agent with context
    const contextKey = context?.businessType || 'default';
    const agentKey = `agent_${contextKey}`;

    if (this.agentExecutor && this.agentExecutor._contextKey === agentKey) {
      return;
    }

    try {
      const llm = this.langChainProvider.getLLM();
      const tools = [checkAvailabilityTool, this.suggestTimesTool.getTool(), confirmBookingTool];

      // Get business context for personalized prompt
      const businessType = context?.businessType || 'business';
      const businessContext = this.getBusinessContext(businessType);

      // Get current date information
      const now = new Date();
      const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const months = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      const today = daysOfWeek[now.getDay()];
      const tomorrow = daysOfWeek[(now.getDay() + 1) % 7];
      const dayAfterTomorrow = daysOfWeek[(now.getDay() + 2) % 7];
      const currentDate = `${now.getDate()} de ${months[now.getMonth()]}`;

      // Calculate next few days for suggestions
      const nextDays: string[] = [];
      for (let i = 1; i <= 7; i++) {
        const nextDay = new Date(now);
        nextDay.setDate(now.getDate() + i);
        nextDays.push(daysOfWeek[nextDay.getDay()]);
      }

      // Enhanced system prompt for natural, intelligent conversation
      const systemPrompt = `Eres un asistente de reservas MUY INTELIGENTE y conversacional para ${businessContext.name}.

INFORMACIÓN DE FECHA ACTUAL (MUY IMPORTANTE):
- Hoy es: ${today}, ${currentDate}
- Mañana es: ${tomorrow}
- Pasado mañana es: ${dayAfterTomorrow}
- Días disponibles esta semana: ${nextDays.slice(0, 5).join(', ')}

CUANDO OFREZCAS OPCIONES DE DÍAS:
- SIEMPRE menciona el día de la semana específico (ej: "mañana (${tomorrow})", "${nextDays[0]}", "${nextDays[1]}")
- Ofrece 2-3 opciones específicas de días
- Usa el formato: "¿Te gustaría mañana (${tomorrow}), ${nextDays[0]} o ${nextDays[1]}?"
- NUNCA digas solo "mañana" sin el día de la semana, siempre di "mañana (${tomorrow})" o el día específico

TU PERSONALIDAD:
- Eres amable, empático y genuinamente útil
- Hablas de forma natural, como un humano real (NO robótico)
- Muestras entusiasmo cuando ayudas
- Eres paciente y comprensivo
- Reconoces las necesidades del cliente antes de ofrecer soluciones

CONTEXTO DEL NEGOCIO:
- Tipo: ${businessContext.name}
- Tono: ${businessContext.tone}
- Servicios: ${businessContext.services}

TU OBJETIVO:
Mantener una conversación NATURAL y FLUIDA para ayudar al cliente a reservar. No solo respondes preguntas, mantienes un diálogo real.

HERRAMIENTAS DISPONIBLES:
- check_availability: Verifica horarios disponibles para una fecha. SIEMPRE usa esto ANTES de sugerir horarios.
- suggest_times: Sugiere los mejores horarios según preferencias del cliente
- confirm_booking: Confirma la reserva cuando el cliente está de acuerdo

CÓMO CONVERSAR (MUY IMPORTANTE):

1. SALUDO INICIAL:
   - Saluda de forma natural y amigable
   - Pregunta cómo puedes ayudar
   - Ejemplo: "¡Hola! Bienvenido a ${businessContext.name}. ¿En qué puedo ayudarte hoy? ¿Te gustaría reservar una cita?"

2. ESCUCHA ACTIVA:
   - Cuando el cliente responde, haz preguntas de seguimiento
   - Si dice "sí, quiero una cita" → Pregunta "Perfecto, ¿para cuándo te gustaría?"
   - Si dice "esta semana" → Pregunta "¿Prefieres mañana, jueves o viernes?"
   - Sé proactivo, no esperes a que el cliente lo diga todo

3. VERIFICACIÓN DE DISPONIBILIDAD:
   - Cuando el cliente menciona una fecha, INMEDIATAMENTE usa check_availability
   - Di: "Déjame verificar la disponibilidad para [fecha]..."
   - Usa la herramienta para obtener disponibilidad real
   - Muestra los horarios disponibles de forma clara

4. SUGERENCIA DE HORARIOS:
   - Después de verificar, ofrece 2-3 opciones específicas
   - Pregunta cuál prefiere: "Tenemos disponible a las 10:00, 11:00 y 14:30. ¿Cuál te viene mejor?"

5. CONFIRMACIÓN:
   - Cuando el cliente confirma, usa confirm_booking
   - Confirma todos los detalles: fecha, hora, servicio
   - Sé entusiasta: "¡Perfecto! Tu cita está confirmada para el [fecha] a las [hora]"
   - Pregunta si necesita algo más

6. CIERRE:
   - Agradece al cliente
   - Recuerda los detalles de la cita
   - Ofrece ayuda adicional

REGLAS CRÍTICAS:
- SIEMPRE usa check_availability ANTES de sugerir horarios
- NUNCA inventes disponibilidad - siempre usa las herramientas
- Sé conversacional, NO scripted
- Muestra personalidad manteniendo profesionalismo
- Si una herramienta falla, disculpa sinceramente y ofrece alternativas
- Mantén respuestas naturales (2-4 frases, no muy largas)
- Usa español principalmente
- Recuerda el contexto de la conversación anterior

EJEMPLO DE CONVERSACIÓN NATURAL:

Cliente: "Hola"
Tú: "¡Hola! Bienvenido a ${businessContext.name}. ¿En qué puedo ayudarte hoy? ¿Te gustaría agendar una cita?"

Cliente: "Sí, me gustaría"
Tú: "Perfecto, me encanta ayudarte. ¿Para cuándo te gustaría? ¿Esta semana o la próxima?"

Cliente: "Esta semana"
Tú: "Excelente. ¿Qué día prefieres? ¿Mañana (${tomorrow}), ${nextDays[0]} o ${nextDays[1]}?"

Cliente: "El viernes"
Tú: "Perfecto, el viernes. Déjame verificar qué horarios tenemos disponibles..." [usa check_availability]
Tú: "Tenemos disponible el viernes a las 10:00, 11:00 y 14:30. ¿Cuál prefieres?"

Cliente: "Las 11:00"
Tú: "¡Excelente! El viernes a las 11:00. ¿Con qué profesional te gustaría tener la consulta?"

Recuerda: Eres INTELIGENTE, CONVERSACIONAL y tu objetivo es crear una experiencia positiva que haga que los clientes quieran volver.`;

      const agent = await createReactAgent({
        llm,
        tools,
        prompt: systemPrompt,
      });

      // Store context key for caching
      agent._contextKey = agentKey;
      this.agentExecutor = agent;

      this.logger.log(`BookingAgentChain initialized successfully for: ${businessContext.name}`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize agent: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Process a booking request using LangChain agent with tools
   *
   * @param message - User message
   * @param context - Context including businessId, customerId, etc.
   * @returns Agent response
   */
  async processRequest(
    message: string,
    context: {
      businessId: string;
      customerId?: string;
      businessType?: string;
      [key: string]: unknown;
    },
  ): Promise<string> {
    try {
      // Initialize agent with context for personalized prompt
      await this.initializeAgent({ businessType: context.businessType });

      if (!this.agentExecutor) {
        this.logger.error('Agent executor not initialized');
        throw new Error('Agent executor not initialized');
      }

      // Get or create memory for this conversation
      const conversationKey = `${context.businessId}_${context.customerId || 'anonymous'}`;
      const memory = this.getOrCreateMemory(conversationKey);

      // Load conversation history
      const historyMessages = await memory.getMessages();
      const { HumanMessage } = await import('@langchain/core/messages');

      // Build messages array for the agent
      const messages = [...historyMessages, new HumanMessage(message)];

      // Invoke agent (createReactAgent returns a CompiledStateGraph)
      const result = await this.agentExecutor.invoke({
        messages,
      });

      // Extract all messages from result to find tool calls
      const resultMessages = result.messages || [];

      // Find tool calls for availability checking
      const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
      resultMessages.forEach(
        (msg: { _getType?: () => string; name?: string; args?: Record<string, unknown> }) => {
          if (msg._getType && msg._getType() === 'tool') {
            toolCalls.push({
              name: msg.name,
              args: msg.args || {},
              content: msg.content,
            });
          }
        },
      );

      // Extract the last AI message from the result
      const lastAIMessage = resultMessages
        .slice()
        .reverse()
        .find((msg: { _getType: () => string }) => msg._getType() === 'ai');

      const responseText =
        lastAIMessage?.content || result.output || 'Lo siento, no pude procesar tu solicitud.';

      // Check if booking was confirmed (look for confirm_booking tool call in messages)
      let bookingStatus: 'pending' | 'confirmed' | 'cancelled' = 'pending';
      let bookingId: string | undefined;
      const bookingDetails: {
        date?: string;
        time?: string;
        service?: string;
        customerName?: string;
      } = {};

      // Check tool calls in result messages for booking confirmation
      const toolMessages = resultMessages.filter(
        (msg: { _getType: () => string; name?: string; content?: string }) =>
          msg._getType() === 'tool' && msg.name === 'confirm_booking',
      );

      if (toolMessages.length > 0) {
        bookingStatus = 'confirmed';
        try {
          const toolResult = JSON.parse(toolMessages[0].content || '{}');
          bookingId = toolResult.bookingId;
          // Try to extract details from tool result or message context
          if (toolResult.message) {
            // Extract date/time from message if available
            const dateMatch = toolResult.message.match(/(\d{4}-\d{2}-\d{2})/);
            const timeMatch = toolResult.message.match(/(\d{2}:\d{2})/);
            if (dateMatch) bookingDetails.date = dateMatch[1];
            if (timeMatch) bookingDetails.time = timeMatch[1];
          }
        } catch (e) {
          this.logger.warn('Could not parse tool result for booking details');
        }
      }

      // Save to memory
      await memory.addUserMessage(message);
      await memory.addAIMessage(responseText);

      this.logger.log(`Agent processed request successfully for conversation: ${conversationKey}`);

      // Return enhanced response with tool calls for frontend
      const response: {
        response: string;
        toolCalls?: Array<{ name: string; args: Record<string, unknown> }>;
      } = {
        response: responseText,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };

      // Add booking status if confirmed
      if (bookingStatus === 'confirmed') {
        response.bookingStatus = bookingStatus;
        response.bookingId = bookingId;
        response.bookingDetails =
          Object.keys(bookingDetails).length > 0 ? bookingDetails : undefined;
        response.nextAction = 'send_confirmation';
        return JSON.stringify(response);
      }

      // Return JSON string for consistency (frontend can parse it)
      return JSON.stringify(response);
    } catch (error) {
      this.logger.error(
        `Error processing request: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Return friendly error message with more details in dev
      const errorMessage = (error as Error).message || 'Unknown error';
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        return `Error: ${errorMessage}. Por favor, verifica los logs del servidor.`;
      }
      return 'Lo siento, hubo un problema procesando tu solicitud. Por favor, intenta de nuevo o contacta con soporte.';
    }
  }

  /**
   * Get or create memory for a conversation
   */
  private getOrCreateMemory(conversationKey: string): InMemoryChatMessageHistory {
    if (!this.memories.has(conversationKey)) {
      this.memories.set(conversationKey, new InMemoryChatMessageHistory());
    }
    return this.memories.get(conversationKey)!;
  }

  /**
   * Clear memory for a conversation
   */
  clearMemory(conversationKey: string): void {
    this.memories.delete(conversationKey);
    this.logger.log(`Cleared memory for conversation: ${conversationKey}`);
  }
}

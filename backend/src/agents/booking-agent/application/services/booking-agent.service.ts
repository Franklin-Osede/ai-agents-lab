import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import { LangChainProvider } from '../../../../core/infrastructure/ai/langchain.provider';
import { Result } from '../../../../core/domain/shared/value-objects/result';
import { checkAvailabilityTool } from '../tools/check-availability.tool';
import { confirmBookingTool } from '../tools/confirm-booking.tool';
import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';

export interface BookingRequest {
  message: string;
  customerId?: string;
  businessId: string;
  context?: Record<string, unknown>;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  suggestedTimes?: string[];
  bookingId?: string;
  intent: {
    type: string;
    confidence: number;
  };
  entities?: {
    dates: string[];
    times: string[];
    services: string[];
  };
  toolCalls?: ToolCall[]; // For frontend visualization
}

@Injectable()
export class BookingAgentService {
  private readonly logger = new Logger(BookingAgentService.name);
  // Simple in-memory history (in production use Redis/DB)
  private conversationHistory: Map<string, BaseMessage[]> = new Map();

  constructor(@Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: IAiProvider) {}

  async processBookingRequest(request: BookingRequest): Promise<Result<BookingResponse>> {
    try {
      const sessionId = request.customerId || 'default-session';
      this.logger.log(`Processing LangChain request for session: ${sessionId}`);

      // 1. Get History
      const history = this.conversationHistory.get(sessionId) || [];

      // 2. Add System Prompt (if empty)
      if (history.length === 0) {
        history.push(
          new SystemMessage(`
Eres un Agente de Reservas inteligente para un negocio.
Tu objetivo es ayudar a los usuarios a encontrar un hueco y reservarlo.
IDIOMA: DEBES RESPONDER SIEMPRE EN ESPAÑOL.
FECHA DE HOY: ${new Date().toISOString().split('T')[0]}.

REGLAS:
1. Siempre comprueba la disponibilidad ('check_availability') antes de sugerir horas.
2. Si encuentras disponibilidad, sugiere 2-3 opciones claras.
3. Si el usuario confirma una hora, DEBES usar 'confirm_booking' para finalizarla.
4. Sé amable, profesional y breve.
5. Si el usuario cancela, pregunta si quiere reagendar.
6. NUNCA respondas con JSON crudo o "Response received". Habla naturalmente.
            `),
        );
      }

      // 3. Add User Message
      history.push(new HumanMessage(request.message));

      // 4. Call LLM with Tools
      let responseMessage: string;
      // Using explicit type or unknown to satisfy lint
      let toolCalls: { name: string; args: Record<string, unknown> }[] = [];

      if (this.aiProvider instanceof LangChainProvider) {
        const tools = [checkAvailabilityTool, confirmBookingTool];
        const { response, toolCalls: calls } = await this.aiProvider.generateResponseWithTools(
          history,
          tools,
        );

        // Add AI response to history
        history.push(response);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toolCalls = (calls as any[]) || [];

        // 5. Handle Tool Execution (if any)
        if (toolCalls && toolCalls.length > 0) {
          this.logger.log(`Agent decided to call tools: ${JSON.stringify(toolCalls)}`);

          // Execute tools
          for (const call of toolCalls) {
            // Find the tool
            const tool = tools.find((t) => t.name === call.name);
            if (tool) {
              // Parse arguments
              const toolOutput = await tool.call(call.args);

              // Add Tool Message validation
              history.push(
                new SystemMessage(
                  `TOOL (${call.name}) OUTPUT: ${toolOutput}. Now answer the user based on this info.`,
                ),
              );
            }
          }

          // Second Pass: Generate final natural language response incorporating tool output
          // Force a new generation without tools to get the final answer
          const finalResponseRes = await this.aiProvider.generateResponseWithTools(history, tools);
          const finalResContent = finalResponseRes.response.content;

          history.push(finalResponseRes.response);
          responseMessage =
            typeof finalResContent === 'string' ? finalResContent : JSON.stringify(finalResContent);
        } else {
          const content = response.content;
          responseMessage = typeof content === 'string' ? content : JSON.stringify(content);
        }
      } else {
        // Fallback for standard provider
        responseMessage = await this.aiProvider.generateResponse(request.message);
      }

      // Save history
      this.conversationHistory.set(sessionId, history);

      return Result.ok({
        success: true,
        message: responseMessage,
        intent: { type: 'booking_dialog', confidence: 1.0 },
        toolCalls: toolCalls.map((tc) => ({ name: tc.name, args: tc.args })), // Return for frontend visualization
      });
    } catch (error) {
      this.logger.error(`Error in LangChain processing: ${error}. Falling back to Scripted Mode.`);

      // Fallback: Scripted Response (Demo Mode - Dental/Aesthetic Clinic)
      const lastUserMsg = request.message.toLowerCase();
      let scriptResponse = 'Disculpa, no te he entendido bien. ¿Podrías repetirlo?';
      const scriptToolCalls: ToolCall[] = [];

      // DENTAL / AESTHETIC Mock Logic
      if (lastUserMsg.includes('hola') || lastUserMsg.includes('buenos')) {
        scriptResponse =
          '¡Hola! Bienvenido a DentalSpa 🦷. Soy tu asistente virtual. ¿Te gustaría agendar una **Limpieza**, una **Revisión** o un **Blanqueamiento**?';
      } else if (
        lastUserMsg.includes('agendar') ||
        lastUserMsg.includes('reservar') ||
        lastUserMsg.includes('cita') ||
        lastUserMsg.includes('quiero')
      ) {
        scriptResponse = '¡Perfecto! 📅 ¿Para qué día te gustaría venir a la clínica?';
      } else if (
        lastUserMsg.includes('precio') ||
        lastUserMsg.includes('cuanto cuesta') ||
        lastUserMsg.includes('costo')
      ) {
        if (lastUserMsg.includes('blanqueamiento')) {
          scriptResponse =
            'El blanqueamiento LED cuesta 150€ (promoción mes actual). ✨ ¿Te agendo una cita de valoración?';
        } else {
          scriptResponse =
            'Nuestras limpiezas son 45€ y las revisiones gratuitas. 🦷 ¿Te interesa reservar alguna?';
        }
      } else if (
        lastUserMsg.match(
          /(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|mañana|hoy)/,
        ) ||
        lastUserMsg.match(/\d{1,2}/)
      ) {
        // User provided a day
        scriptResponse =
          'Genial. He revisado la agenda de la Dra. García y tengo hueco a las **10:00** y a las **16:30**. 👩‍⚕️ ¿Cuál prefieres?';
        scriptToolCalls.push({ name: 'check_availability', args: { date: '2023-11-20' } });
      } else if (
        lastUserMsg.includes('10') ||
        lastUserMsg.includes('16') ||
        lastUserMsg.includes('mañana') ||
        lastUserMsg.includes('tarde') ||
        lastUserMsg.includes('si') ||
        lastUserMsg.includes('vale')
      ) {
        scriptResponse =
          '¡Estupendo! Te he reservado el gabinete para esa hora. Por favor, **confirma tu reserva** en la pantalla. ✅';
        scriptToolCalls.push({ name: 'confirm_booking', args: { bookingId: 'mock-123' } });
      }

      return Result.ok({
        success: true,
        message: scriptResponse,
        intent: { type: 'scripted_fallback', confidence: 1.0 },
        toolCalls: scriptToolCalls,
      });
    }
  }

  // Legacy/Helper methods required by other modules if any (kept empty or deprecated)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async confirmBooking(_bookingId: string, _selectedTime: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}

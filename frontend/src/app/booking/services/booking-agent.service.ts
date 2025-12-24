import { Injectable, inject } from "@angular/core";
import {
  Agent,
  AgentType,
  AgentContext,
  AgentResponse,
  AgentState,
} from "../../shared/interfaces/agent.interface";
import { VoiceService } from "../../shared/services/voice.service";

/**
 * Booking Agent Service
 *
 * Wrapper around the existing voice booking functionality.
 * Handles restaurant reservations, appointments, and table bookings.
 */
@Injectable({
  providedIn: "root",
})
export class BookingAgentService implements Agent {
  readonly id: AgentType = "booking";
  readonly name = "Booking Agent";
  readonly description = "AI agent for reservations and appointments";

  private voiceService = inject(VoiceService);

  // Current booking state
  private currentNiche = "restaurant";
  private currentStep = "greeting";
  private conversationHistory: { question: string; answer: string }[] = [];

  /**
   * Called when agent is activated
   */
  onActivate(context: AgentContext): void {
    console.log("📅 Booking Agent activated", context);

    // Set niche from context
    if (context.bookingNiche) {
      this.currentNiche = context.bookingNiche;
    }

    // Reset to greeting if starting fresh
    if (!context.currentStep) {
      this.currentStep = "greeting";
      this.conversationHistory = [];
    }
  }

  /**
   * Called when agent is deactivated
   */
  onDeactivate(): AgentContext {
    console.log("📅 Booking Agent deactivated");

    return {
      previousAgent: "booking",
      bookingNiche: this.currentNiche,
      currentStep: this.currentStep,
      conversationHistory: this.conversationHistory,
    };
  }

  /**
   * Handle user input
   */
  handleInput(
    input: string,
    type: "text" | "voice" | "select" = "select"
  ): AgentResponse | null {
    console.log("📅 Booking input:", input);

    // For now, return a simple response
    // The actual booking flow is handled by the VoiceBookingComponent
    // This service acts as a bridge to the orchestrator

    return {
      text: `Procesando reserva: ${input}`,
      suggestions: ["Continuar", "Cancelar"],
      success: true,
    };
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return {
      currentStep: this.currentStep,
      memory: {
        niche: this.currentNiche,
        history: this.conversationHistory,
      },
      lastActive: new Date(),
    };
  }

  /**
   * Restore state
   */
  setState(state: AgentState): void {
    if (state.currentStep) {
      this.currentStep = state.currentStep;
    }
    if (state.memory) {
      this.currentNiche = state.memory.niche || "restaurant";
      this.conversationHistory = state.memory.history || [];
    }
  }

  /**
   * Reset agent
   */
  reset(): void {
    this.currentStep = "greeting";
    this.currentNiche = "restaurant";
    this.conversationHistory = [];
  }

  /**
   * Check if agent can handle an intent
   */
  canHandle(intent: string): boolean {
    const bookingIntents = [
      "book",
      "reserve",
      "reservation",
      "appointment",
      "table",
      "schedule",
      "dentist",
      "doctor",
      "restaurant",
    ];

    return bookingIntents.some((keyword) =>
      intent.toLowerCase().includes(keyword)
    );
  }

  /**
   * Receive message from another agent
   */
  receiveMessage(fromAgent: AgentType, message: any): void {
    console.log(
      `📨 Booking Agent received message from ${fromAgent}:`,
      message
    );

    if (message.type === "start_booking") {
      this.currentNiche = message.niche || "restaurant";
      this.currentStep = "greeting";
    }
  }

  /**
   * Complete booking and return to previous agent
   */
  completeBooking(bookingDetails: any): void {
    console.log("✅ Booking completed:", bookingDetails);

    // This would typically save the booking and notify the orchestrator
    // The orchestrator would then switch back to the previous agent
  }
}

import { APP_INITIALIZER, Provider } from "@angular/core";
import { AgentOrchestratorService } from "../services/agent-orchestrator.service";
import { RiderAgentService } from "../../rider-agent/services/rider-agent.service";
import { BookingAgentService } from "../../booking/services/booking-agent.service";
import { AbandonedCartAgentService } from "../../abandoned-cart/services/abandoned-cart-agent.service";

/**
 * Initialize all agents when the app starts
 *
 * This function registers all available agents with the orchestrator.
 * Add new agents here as you create them.
 */
export function initializeAgents(
  orchestrator: AgentOrchestratorService,
  riderAgent: RiderAgentService,
  bookingAgent: BookingAgentService,
  cartAgent: AbandonedCartAgentService
): () => void {
  return () => {
    console.log("🚀 Initializing Agent System...");

    // Register all agents
    orchestrator.registerAgent(riderAgent);
    orchestrator.registerAgent(bookingAgent);
    orchestrator.registerAgent(cartAgent);

    console.log("✅ Agent System initialized");
    console.log(
      "📋 Registered agents:",
      orchestrator.getDebugInfo().registeredAgents
    );

    // Optionally activate default agent
    // orchestrator.activateAgent('rider');
  };
}

/**
 * Provider for agent initialization
 *
 * Add this to your app.config.ts or main module providers
 */
export const AGENT_INITIALIZER_PROVIDER: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initializeAgents,
  deps: [
    AgentOrchestratorService,
    RiderAgentService,
    BookingAgentService,
    AbandonedCartAgentService,
  ],
  multi: true,
};

import { Injectable, signal, computed, inject } from "@angular/core";
import { Router } from "@angular/router";
import {
  Agent,
  AgentType,
  AgentContext,
  AgentState,
} from "../interfaces/agent.interface";

/**
 * Agent Orchestrator Service
 *
 * Central coordinator for all agents in the system.
 * Manages agent lifecycle, context sharing, and navigation.
 *
 * Benefits:
 * - Single source of truth for active agent
 * - Seamless context transfer between agents
 * - Prevents conflicts between agents
 * - Easy to add new agents
 */
@Injectable({
  providedIn: "root",
})
export class AgentOrchestratorService {
  private router = inject(Router);

  // Registry of all available agents
  private agents = new Map<AgentType, Agent>();

  // Currently active agent
  activeAgent = signal<AgentType>("none");

  // Shared context across all agents
  sharedContext = signal<AgentContext>({});

  // Navigation history
  private navigationHistory: AgentType[] = [];

  // Agent states (for persistence)
  private agentStates = new Map<AgentType, AgentState>();

  // Computed: Get active agent instance
  activeAgentInstance = computed(() => {
    const agentType = this.activeAgent();
    return agentType !== "none" ? this.agents.get(agentType) : null;
  });

  constructor() {
    // Load saved state from localStorage if available
    this.loadState();
  }

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(agent: Agent): void {
    if (this.agents.has(agent.id)) {
      console.warn(`Agent ${agent.id} is already registered. Replacing...`);
    }
    this.agents.set(agent.id, agent);
    console.log(`✅ Agent registered: ${agent.name} (${agent.id})`);
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentType: AgentType): void {
    if (this.agents.has(agentType)) {
      this.agents.delete(agentType);
      console.log(`❌ Agent unregistered: ${agentType}`);
    }
  }

  /**
   * Get an agent instance
   */
  getAgent(agentType: AgentType): Agent | undefined {
    return this.agents.get(agentType);
  }

  /**
   * Activate an agent
   * Deactivates current agent and activates the new one
   */
  activateAgent(agentType: AgentType, context?: AgentContext): void {
    // Validate agent exists
    const newAgent = this.agents.get(agentType);
    if (!newAgent) {
      console.error(`❌ Agent ${agentType} not found. Available agents:`, [
        ...this.agents.keys(),
      ]);
      return;
    }

    const currentAgentType = this.activeAgent();
    const currentAgent = this.agents.get(currentAgentType);

    // Deactivate current agent if exists
    if (currentAgent && currentAgentType !== "none") {
      console.log(`⏸️ Deactivating agent: ${currentAgentType}`);

      // Save current agent state
      const savedContext = currentAgent.onDeactivate();
      this.agentStates.set(currentAgentType, currentAgent.getState());

      // Merge saved context with shared context
      this.sharedContext.update((ctx) => ({ ...ctx, ...savedContext }));

      // Add to navigation history
      this.navigationHistory.push(currentAgentType);
    }

    // Merge provided context with shared context
    if (context) {
      this.sharedContext.update((ctx) => ({ ...ctx, ...context }));
    }

    // Activate new agent
    console.log(`▶️ Activating agent: ${agentType}`);
    this.activeAgent.set(agentType);

    // Restore agent state if available
    const savedState = this.agentStates.get(agentType);
    if (savedState) {
      newAgent.setState(savedState);
    }

    // Call agent's onActivate hook
    newAgent.onActivate(this.sharedContext());

    // Save state to localStorage
    this.saveState();
  }

  /**
   * Go back to previous agent
   */
  goBack(): void {
    if (this.navigationHistory.length > 0) {
      const previousAgent = this.navigationHistory.pop()!;
      this.activateAgent(previousAgent);
    } else {
      console.warn("⚠️ No previous agent in history");
    }
  }

  /**
   * Update shared context
   */
  updateContext(updates: Partial<AgentContext>): void {
    this.sharedContext.update((ctx) => ({ ...ctx, ...updates }));
    this.saveState();
  }

  /**
   * Get shared context
   */
  getContext(): AgentContext {
    return this.sharedContext();
  }

  /**
   * Send message from one agent to another
   */
  sendMessage(fromAgent: AgentType, toAgent: AgentType, message: any): void {
    const targetAgent = this.agents.get(toAgent);
    if (targetAgent && targetAgent.receiveMessage) {
      targetAgent.receiveMessage(fromAgent, message);
    } else {
      console.warn(
        `⚠️ Agent ${toAgent} cannot receive messages or doesn't exist`
      );
    }
  }

  /**
   * Reset all agents and clear context
   */
  resetAll(): void {
    // Deactivate current agent
    const currentAgent = this.activeAgentInstance();
    if (currentAgent) {
      currentAgent.onDeactivate();
    }

    // Reset all agents
    this.agents.forEach((agent) => agent.reset());

    // Clear state
    this.activeAgent.set("none");
    this.sharedContext.set({});
    this.navigationHistory = [];
    this.agentStates.clear();

    // Clear localStorage
    this.clearState();

    console.log("🔄 All agents reset");
  }

  /**
   * Reset a specific agent
   */
  resetAgent(agentType: AgentType): void {
    const agent = this.agents.get(agentType);
    if (agent) {
      agent.reset();
      this.agentStates.delete(agentType);
      console.log(`🔄 Agent ${agentType} reset`);
    }
  }

  /**
   * Navigate to a route (helper method)
   */
  navigateTo(route: string, params?: any): void {
    if (params) {
      this.router.navigate([route], { queryParams: params });
    } else {
      this.router.navigate([route]);
    }
  }

  /**
   * Check if an agent can handle a specific intent
   */
  findAgentForIntent(intent: string): AgentType | null {
    for (const [agentType, agent] of this.agents.entries()) {
      if (agent.canHandle && agent.canHandle(intent)) {
        return agentType;
      }
    }
    return null;
  }

  /**
   * Save state to localStorage
   */
  private saveState(): void {
    try {
      const state = {
        activeAgent: this.activeAgent(),
        sharedContext: this.sharedContext(),
        navigationHistory: this.navigationHistory,
        agentStates: Array.from(this.agentStates.entries()),
      };
      localStorage.setItem("agent-orchestrator-state", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save orchestrator state:", error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadState(): void {
    try {
      const saved = localStorage.getItem("agent-orchestrator-state");
      if (saved) {
        const state = JSON.parse(saved);
        this.activeAgent.set(state.activeAgent || "none");
        this.sharedContext.set(state.sharedContext || {});
        this.navigationHistory = state.navigationHistory || [];
        this.agentStates = new Map(state.agentStates || []);
      }
    } catch (error) {
      console.error("Failed to load orchestrator state:", error);
    }
  }

  /**
   * Clear saved state
   */
  private clearState(): void {
    localStorage.removeItem("agent-orchestrator-state");
  }

  /**
   * Get debug info
   */
  getDebugInfo(): any {
    return {
      activeAgent: this.activeAgent(),
      registeredAgents: Array.from(this.agents.keys()),
      sharedContext: this.sharedContext(),
      navigationHistory: this.navigationHistory,
      agentStates: Array.from(this.agentStates.keys()),
    };
  }
}

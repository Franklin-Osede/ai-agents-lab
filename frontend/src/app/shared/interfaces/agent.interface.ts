/**
 * Agent Interface
 *
 * All agents in the system must implement this interface.
 * This ensures consistency and allows the orchestrator to manage them uniformly.
 */

export type AgentType = "rider" | "booking" | "abandoned-cart" | "none";

/**
 * Shared context that can be passed between agents
 */
export interface AgentContext {
  // User information
  userId?: string;
  userName?: string;
  userGender?: "male" | "female";

  // Cart state
  cart?: any[];
  cartTotal?: number;

  // Navigation
  returnTo?: AgentType;
  previousAgent?: AgentType;

  // Intent/Action
  intent?: string;
  action?: string;

  // Agent-specific data
  bookingNiche?: string;
  cuisineType?: string;

  // Notifications
  notification?: string;
  message?: string;

  // State
  currentStep?: string;

  // Any additional data
  [key: string]: any;
}

/**
 * Response from an agent after processing input
 */
export interface AgentResponse {
  // Response text to display
  text?: string;

  // Suggestions/buttons to show
  suggestions?: string[];

  // Cards to display (e.g., menu items)
  cards?: any[];

  // Navigation action
  navigate?: {
    route: string;
    params?: any;
  };

  // Switch to another agent
  switchToAgent?: {
    agentType: AgentType;
    context?: AgentContext;
  };

  // Update shared state
  updateContext?: Partial<AgentContext>;

  // Success/error status
  success?: boolean;
  error?: string;

  // Metadata
  [key: string]: any;
}

/**
 * Agent state that can be saved/restored
 */
export interface AgentState {
  // Current conversation state
  currentStep?: string;
  currentContext?: string;
  currentCategory?: string;

  // Conversation history
  messages?: any[];

  // Agent-specific state
  memory?: any;

  // Timestamp
  lastActive?: Date;

  [key: string]: any;
}

/**
 * Base Agent Interface
 *
 * All agents must implement these methods
 */
export interface Agent {
  // Unique identifier
  readonly id: AgentType;

  // Human-readable name
  readonly name: string;

  // Description of what this agent does
  readonly description?: string;

  /**
   * Called when the agent is activated
   * @param context - Shared context from previous agent or orchestrator
   */
  onActivate(context: AgentContext): void;

  /**
   * Called when the agent is deactivated
   * @returns Context to pass to next agent or save
   */
  onDeactivate(): AgentContext;

  /**
   * Handle user input (text or voice)
   * @param input - User's input
   * @param type - Type of input ('text', 'voice', 'select')
   * @returns Agent's response
   */
  handleInput(
    input: string,
    type?: "text" | "voice" | "select"
  ): AgentResponse | null;

  /**
   * Get current agent state (for persistence)
   * @returns Current state
   */
  getState(): AgentState;

  /**
   * Restore agent state (from persistence)
   * @param state - State to restore
   */
  setState(state: AgentState): void;

  /**
   * Reset agent to initial state
   */
  reset(): void;

  /**
   * Optional: Receive message from another agent
   * @param fromAgent - Source agent ID
   * @param message - Message payload
   */
  receiveMessage?(fromAgent: AgentType, message: any): void;

  /**
   * Optional: Check if agent can handle a specific intent
   * @param intent - Intent to check
   * @returns true if agent can handle this intent
   */
  canHandle?(intent: string): boolean;
}

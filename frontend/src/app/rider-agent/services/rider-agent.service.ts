import { Injectable, inject } from "@angular/core";
import {
  Agent,
  AgentType,
  AgentContext,
  AgentResponse,
  AgentState,
} from "../../shared/interfaces/agent.interface";
import { StateMachineService } from "./state-machine.service";
import { CartService } from "../../shared/services/cart.service";
import { UserSessionService } from "./user-session.service";

/**
 * Rider Agent Service
 *
 * Wrapper around the existing StateMachineService to implement the Agent interface.
 * This allows the Rider Agent to work with the orchestrator while preserving
 * all existing functionality.
 *
 * IMPORTANT: This does NOT modify the StateMachineService or dialogues-data.ts
 * It simply wraps them to provide a consistent interface.
 */
@Injectable({
  providedIn: "root",
})
export class RiderAgentService implements Agent {
  readonly id: AgentType = "rider";
  readonly name = "Rider Agent";
  readonly description = "AI agent for food ordering and delivery";

  // Inject existing services (NO CHANGES to them)
  private stateMachine = inject(StateMachineService);
  private cartService = inject(CartService);
  private userSession = inject(UserSessionService);

  /**
   * Called when agent is activated
   */
  onActivate(context: AgentContext): void {
    console.log("🍔 Rider Agent activated", context);

    // Update user session if provided
    if (context.userName || context.userId) {
      // User session is already managed by UserSessionService
      // No need to duplicate
    }

    // Restore cart if provided
    if (context.cart && context.cart.length > 0) {
      // Cart is already managed by CartService
      // The state machine will sync with it
    }

    // If there's a specific intent, we could pre-set the state
    if (context.intent) {
      // Could handle specific intents here
      console.log("Intent:", context.intent);
    }

    // Show notification if provided
    if (context.notification) {
      console.log("📢 Notification:", context.notification);
      // Could add this to the chat messages
    }
  }

  /**
   * Called when agent is deactivated
   */
  onDeactivate(): AgentContext {
    console.log("🍔 Rider Agent deactivated");

    // Save current state to context
    const user = this.userSession.user();
    const currentState = this.stateMachine.currentState();

    return {
      userName: user?.name,
      userGender: user?.gender,
      cart: this.cartService.cartItems(),
      cartTotal: this.cartService.total,
      previousAgent: "rider",
      // Save current conversation state
      cuisineType: currentState.context,
      lastState: currentState,
    };
  }

  /**
   * Handle user input
   * This is the main method that processes user interactions
   */
  handleInput(
    input: string,
    type: "text" | "voice" | "select" = "text"
  ): AgentResponse | null {
    // Determine if this is a button selection or free text
    const inputType: "select" | "intent" =
      type === "select" ? "select" : "intent";

    // Use the EXISTING state machine logic (NO CHANGES)
    const result = this.stateMachine.handleTransition(input, inputType);

    if (!result) {
      return null;
    }

    // Convert state machine result to AgentResponse format
    const response: AgentResponse = {
      text: result.response,
      suggestions: result.suggestions,
      cards: result.cards,
      success: true,
      // Pass through metadata for UI logic
      id: result.id,
      category: result.category,
    };

    // Handle side effects: Add items to cart
    // This fixes the synchronization bug
    const lastItem =
      this.stateMachine.memory.order[this.stateMachine.memory.order.length - 1];
    if (
      lastItem &&
      !this.cartService.cartItems().find((i) => i.name === lastItem.name)
    ) {
      this.cartService.addToCart({
        id: Date.now().toString(),
        name: lastItem.name,
        price: lastItem.price || 10.0,
        quantity: 1,
        image: lastItem.image || "assets/food_images/default.webp",
        tags: lastItem.tags || [],
      });
    }

    // Handle navigation triggers
    if (result.category === "reservation_entry") {
      response.switchToAgent = {
        agentType: "booking",
        context: {
          bookingNiche: "restaurant",
          returnTo: "rider",
        },
      };
      response.navigate = {
        route: "/booking",
        params: { niche: "restaurant" },
      };
    }

    if (result.category === "delivery_action") {
      response.navigate = {
        route: "/rider/checkout",
      };
    }

    return response;
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return {
      currentContext: this.stateMachine.currentState().context,
      currentCategory: this.stateMachine.currentState().category,
      messages: this.stateMachine.memory.messages || [],
      memory: this.stateMachine.memory,
      lastActive: new Date(),
    };
  }

  /**
   * Restore state
   */
  setState(state: AgentState): void {
    if (state.currentContext && state.currentCategory) {
      this.stateMachine.currentState.set({
        context: state.currentContext as any,
        category: state.currentCategory as any,
      });
    }

    if (state.memory) {
      this.stateMachine.memory = state.memory;
    }
  }

  /**
   * Reset agent
   */
  reset(): void {
    this.stateMachine.reset();
  }

  /**
   * Check if agent can handle an intent
   */
  canHandle(intent: string): boolean {
    const foodIntents = [
      "order",
      "food",
      "restaurant",
      "menu",
      "delivery",
      "japanese",
      "italian",
      "fast_food",
      "spanish",
      "sushi",
      "pizza",
      "burger",
    ];

    return foodIntents.some((keyword) =>
      intent.toLowerCase().includes(keyword)
    );
  }

  /**
   * Receive message from another agent
   */
  receiveMessage(fromAgent: AgentType, message: any): void {
    console.log(`📨 Rider Agent received message from ${fromAgent}:`, message);

    // Handle messages from other agents
    if (message.type === "booking_complete") {
      // Could add a notification to the chat
      console.log("✅ Booking completed, returning to Rider Agent");
    }

    if (message.type === "cart_restored") {
      // Cart was restored from abandoned cart agent
      console.log("🛒 Cart restored with items:", message.items);
    }
  }
}

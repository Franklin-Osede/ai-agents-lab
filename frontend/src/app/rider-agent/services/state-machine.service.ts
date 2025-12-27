import { Injectable, signal } from "@angular/core";
import { DIALOGUES } from "./dialogues-data";

export type StateContext =
  | "general"
  | "japanese"
  | "italian"
  | "fast_food"
  | "spanish";
export type StateCategory =
  | "default"
  | "menu"
  | "kids"
  | "spicy_level"
  | "spicy_pick"
  | "drinks"
  | "dessert"
  | "add_to_order"
  | "view_order"
  | "confirm_order"
  | "checkout"
  | "payment"
  | string;

export interface StateNode {
  id: string; // "context.category"
  response: string;
  suggestions: string[];
  on_select?: Record<string, TransitionAction>;
  on_intent?: Record<string, TransitionAction>;
}

export interface TransitionAction {
  context: StateContext;
  category: StateCategory;
  set_memory?: any;
  add_item?: any;
}

@Injectable({
  providedIn: "root",
})
export class StateMachineService {
  private states = new Map<string, StateNode>();
  currentState = signal<{ context: StateContext; category: StateCategory }>({
    context: "general",
    category: "default",
  });

  // Simple in-memory memory for the demo
  memory: any = {
    order: [],
    spicy_level: null,
    delivery_method: null,
    messages: [], // Persist chat messages
  };

  constructor() {
    this.loadStates();
  }

  private loadStates() {
    // Load from static data
    const data: any = DIALOGUES;

    if (data && data.states) {
      data.states.forEach((s: any) => {
        this.states.set(s.id, s);
      });
      if (data.start_state) {
        this.currentState.set(data.start_state);
      }
    }
  }

  getCurrentStateNode(): StateNode | undefined {
    const { context, category } = this.currentState();
    return this.states.get(`${context}.${category}`);
  }

  handleTransition(
    input: string,
    type: "select" | "intent"
  ): {
    response: string;
    suggestions: string[];
    category: string;
    id: string;
    cards?: any[];
  } | null {
    const node = this.getCurrentStateNode();
    if (!node) return null;

    let action: TransitionAction | undefined;

    if (type === "select" && node.on_select) {
      action = node.on_select[input];
    } else if (type === "intent" && node.on_intent) {
      // Simple mapping for demo.
      action = node.on_intent[input];
    }

    if (action) {
      // Apply transition
      this.currentState.set({
        context: action.context,
        category: action.category,
      });

      // Apply Side Effects (Memory)
      if (action.set_memory) {
        this.memory = { ...this.memory, ...action.set_memory };
      }

      // Apply Side Effects (Cart/Order)
      if (action.add_item) {
        // In a real integration, call CartService here
        // For now, we update memory
        this.memory.order.push(action.add_item);
        console.log("Added to order:", action.add_item);
      }

      const newNode = this.getCurrentStateNode();
      if (!newNode) return null;

      return {
        id: newNode.id, // Exposed for external logic
        response: newNode.response,
        suggestions: newNode.suggestions,
        category: newNode.id.split(".")[1], // Return the category (e.g. 'reservation_entry')
        cards: [], // Future: map context/category to cards
      };
    }

    // fallback: GLOBAL INTERCEPT
    // If input is a known Cuisine Selection intent, force jump to that context's default state

    // fallback: GLOBAL INTERCEPT
    if (type === "intent") {
      // 1. Cuisine Selection
      if (input.startsWith("choose_cuisine_")) {
        const targetContext = input.replace(
          "choose_cuisine_",
          ""
        ) as StateContext;
        this.currentState.set({
          context: targetContext,
          category: "default",
        });

        const newNode = this.getCurrentStateNode();
        if (newNode) return this.createResult(newNode);
      }

      // 2. Global Drinks
      if (input === "choose_global_drinks") {
        // Redirect to a specialized context for drinks selection
        this.currentState.set({
          context: "general",
          category: "choose_drinks_context",
        });
        const newNode = this.getCurrentStateNode();
        if (newNode) return this.createResult(newNode);
      }

      // 3. Global Cheap / Kids -> Map to specific defaults?
      // "Cheap" -> Fast Food Default
      if (input === "choose_global_cheap") {
        this.currentState.set({ context: "fast_food", category: "default" });
        const newNode = this.getCurrentStateNode();
        if (newNode) {
          const res = this.createResult(newNode);
          res.response =
            "Para opciones económicas, nuestro menú Fast Food es inmejorable. " +
            res.response;
          return res;
        }
      }

      // "Kids" -> Italian Kids (Generic choice)
      if (input === "choose_global_kids") {
        this.currentState.set({ context: "italian", category: "kids" });
        const newNode = this.getCurrentStateNode();
        if (newNode) {
          const res = this.createResult(newNode);
          res.response =
            "A los peques les encanta nuestra pasta y pizza. " + res.response;
          return res;
        }
      }

      // 4. Allergy Intercept (Does not change state, just warns? Or redirects to Healthy?)
      if (input === "identify_allergy") {
        // Stay in context but warn? Or move to Japanese (assumed safest)?
        // Let's move to Japanese with a disclaimer.
        this.currentState.set({ context: "japanese", category: "default" });
        const newNode = this.getCurrentStateNode();
        if (newNode) {
          const res = this.createResult(newNode);
          res.response =
            "Tomamos muy en serio las alergias. La cocina japonesa suele ser la más segura (sin gluten/lactosa). " +
            res.response;
          return res;
        }
      }
    }

    // No transition found? Stay or Handle Fallback
    return null;
  }

  reset() {
    this.currentState.set({ context: "general", category: "default" });
    this.memory = { order: [], spicy_level: null, delivery_method: null };
  }

  private createResult(node: StateNode) {
    return {
      id: node.id,
      response: node.response,
      suggestions: node.suggestions,
      category: node.id.split(".")[1],
      cards: [],
    };
  }
}

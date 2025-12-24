import { Injectable, inject } from "@angular/core";
import {
  Agent,
  AgentType,
  AgentContext,
  AgentResponse,
  AgentState,
} from "../../shared/interfaces/agent.interface";
import { AbandonedCartService } from "./abandoned-cart.service";
import { CartService } from "../../shared/services/cart.service";
import { Cart } from "../models/cart.model";

/**
 * Abandoned Cart Agent Service
 *
 * Wrapper around the existing AbandonedCartService.
 * Handles cart recovery, customer outreach, and conversion optimization.
 */
@Injectable({
  providedIn: "root",
})
export class AbandonedCartAgentService implements Agent {
  readonly id: AgentType = "abandoned-cart";
  readonly name = "Cart Recovery Agent";
  readonly description = "AI agent for recovering abandoned carts";

  private abandonedCartService = inject(AbandonedCartService);
  private cartService = inject(CartService);

  // Current state
  private currentCart: Cart | null = null;
  private recoveryMode: "email" | "whatsapp" | "none" = "none";

  /**
   * Called when agent is activated
   */
  onActivate(context: AgentContext): void {
    console.log("🛒 Abandoned Cart Agent activated", context);

    // Load abandoned carts
    this.loadAbandonedCarts();
  }

  /**
   * Called when agent is deactivated
   */
  onDeactivate(): AgentContext {
    console.log("🛒 Abandoned Cart Agent deactivated");

    return {
      previousAgent: "abandoned-cart",
      currentCart: this.currentCart,
      recoveryMode: this.recoveryMode,
    };
  }

  /**
   * Handle user input
   */
  handleInput(
    input: string,
    type: "text" | "voice" | "select" = "select"
  ): AgentResponse | null {
    console.log("🛒 Cart Recovery input:", input);

    // Parse input for cart recovery actions
    if (
      input.toLowerCase().includes("restore") ||
      input.toLowerCase().includes("recuperar")
    ) {
      return this.handleRestoreCart();
    }

    if (input.toLowerCase().includes("email")) {
      return this.handleEmailRecovery();
    }

    if (input.toLowerCase().includes("whatsapp")) {
      return this.handleWhatsAppRecovery();
    }

    return {
      text: "Procesando acción de recuperación...",
      suggestions: ["Restaurar carrito", "Enviar email", "Enviar WhatsApp"],
      success: true,
    };
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return {
      memory: {
        currentCart: this.currentCart,
        recoveryMode: this.recoveryMode,
      },
      lastActive: new Date(),
    };
  }

  /**
   * Restore state
   */
  setState(state: AgentState): void {
    if (state.memory) {
      this.currentCart = state.memory.currentCart || null;
      this.recoveryMode = state.memory.recoveryMode || "none";
    }
  }

  /**
   * Reset agent
   */
  reset(): void {
    this.currentCart = null;
    this.recoveryMode = "none";
  }

  /**
   * Check if agent can handle an intent
   */
  canHandle(intent: string): boolean {
    const cartIntents = [
      "cart",
      "abandoned",
      "recovery",
      "restore",
      "recuperar",
      "carrito",
    ];

    return cartIntents.some((keyword) =>
      intent.toLowerCase().includes(keyword)
    );
  }

  /**
   * Receive message from another agent
   */
  receiveMessage(fromAgent: AgentType, message: any): void {
    console.log(
      `📨 Cart Recovery Agent received message from ${fromAgent}:`,
      message
    );

    if (message.type === "check_abandoned_cart") {
      this.loadAbandonedCarts();
    }
  }

  /**
   * Load abandoned carts
   */
  private loadAbandonedCarts(): void {
    this.abandonedCartService.getAbandonedCarts().subscribe({
      next: (carts) => {
        console.log("📦 Loaded abandoned carts:", carts.length);
        if (carts.length > 0) {
          this.currentCart = carts[0]; // Focus on most recent
        }
      },
      error: (error) => {
        console.error("Failed to load abandoned carts:", error);
      },
    });
  }

  /**
   * Handle restore cart action
   */
  private handleRestoreCart(): AgentResponse {
    if (!this.currentCart) {
      return {
        text: "No hay carritos abandonados para restaurar.",
        suggestions: [],
        success: false,
      };
    }

    // Restore items to cart
    this.currentCart.items.forEach((item) => {
      this.cartService.addToCart({
        id: item.productId,
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
        image: item.imageUrl || "assets/food_images/default.webp",
      });
    });

    return {
      text: `✅ Carrito restaurado con ${this.currentCart.items.length} productos.`,
      suggestions: ["Ver carrito", "Continuar comprando"],
      success: true,
      switchToAgent: {
        agentType: "rider",
        context: {
          notification: "Carrito restaurado exitosamente",
          cart: this.cartService.cartItems(),
        },
      },
    };
  }

  /**
   * Handle email recovery
   */
  private handleEmailRecovery(): AgentResponse {
    if (!this.currentCart) {
      return {
        text: "No hay carrito para enviar email.",
        success: false,
      };
    }

    this.recoveryMode = "email";

    return {
      text: "Preparando email de recuperación...",
      suggestions: ["Enviar", "Cancelar"],
      success: true,
    };
  }

  /**
   * Handle WhatsApp recovery
   */
  private handleWhatsAppRecovery(): AgentResponse {
    if (!this.currentCart) {
      return {
        text: "No hay carrito para enviar WhatsApp.",
        success: false,
      };
    }

    this.recoveryMode = "whatsapp";

    return {
      text: "Preparando mensaje de WhatsApp...",
      suggestions: ["Enviar", "Cancelar"],
      success: true,
    };
  }
}

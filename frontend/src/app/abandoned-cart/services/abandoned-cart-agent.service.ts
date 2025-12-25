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
 * Conversation Steps for Cart Recovery
 */
enum CartRecoveryStep {
  WELCOME = "welcome",
  ACTION_SELECT = "action",
  CONFIRM = "confirm",
  COMPLETE = "complete",
}

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
  private recoveryMode: "email" | "whatsapp" | "restore" | "none" = "none";
  private currentStep: CartRecoveryStep = CartRecoveryStep.WELCOME;
  private abandonedCarts: Cart[] = [];

  /**
   * Called when agent is activated
   */
  onActivate(context: AgentContext): void {
    console.log("🛒 Abandoned Cart Agent activated", context);

    // Reset to welcome step
    this.currentStep = CartRecoveryStep.WELCOME;
    this.recoveryMode = "none";

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
      currentStep: this.currentStep,
    };
  }

  /**
   * Handle user input
   */
  handleInput(
    input: string,
    type: "text" | "voice" | "select" = "select"
  ): AgentResponse | null {
    console.log("🛒 Cart Recovery input:", input, "Step:", this.currentStep);

    const inputLower = input.toLowerCase();

    // Handle based on current step
    switch (this.currentStep) {
      case CartRecoveryStep.WELCOME:
        return this.handleWelcomeStep(inputLower);

      case CartRecoveryStep.ACTION_SELECT:
        return this.handleActionStep(inputLower);

      case CartRecoveryStep.CONFIRM:
        return this.handleConfirmStep(inputLower);

      default:
        return this.getWelcomeResponse();
    }
  }

  /**
   * Get initial welcome response
   */
  getWelcomeResponse(): AgentResponse {
    const cartCount = this.abandonedCarts.length;

    if (cartCount === 0) {
      return {
        text: "¡Hola! No tienes carritos abandonados en este momento. ¡Todo está en orden! 🎉",
        suggestions: ["Ir al Dashboard", "Volver"],
        success: true,
      };
    }

    this.currentCart = this.abandonedCarts[0]; // Focus on most recent
    const itemCount = this.currentCart?.items.length || 0;
    const totalValue = this.currentCart?.totalValue || 0;

    return {
      text: `¡Hola! Veo que tienes ${cartCount} carrito${
        cartCount > 1 ? "s" : ""
      } abandonado${
        cartCount > 1 ? "s" : ""
      }. El más reciente tiene ${itemCount} producto${
        itemCount > 1 ? "s" : ""
      } por un valor de €${totalValue.toFixed(2)}. ¿Te gustaría recuperarlo?`,
      suggestions: [
        "✅ Restaurar Carrito",
        "📧 Enviar Email",
        "💬 Enviar WhatsApp",
        "📊 Ver Dashboard",
      ],
      success: true,
      // Include cart data for UI display
      cartData: {
        count: cartCount,
        items: itemCount,
        total: totalValue,
        cart: this.currentCart,
      },
    };
  }

  /**
   * Handle welcome step
   */
  private handleWelcomeStep(input: string): AgentResponse {
    // User wants to see dashboard
    if (input.includes("dashboard") || input.includes("ver")) {
      return {
        text: "Perfecto, te llevo al dashboard de carritos abandonados.",
        suggestions: [],
        success: true,
        navigate: {
          route: "/abandoned-cart/dashboard",
        },
      };
    }

    // User wants to restore cart
    if (
      input.includes("restaurar") ||
      input.includes("restore") ||
      input.includes("recuperar") ||
      input.includes("sí") ||
      input.includes("si") ||
      input.includes("yes")
    ) {
      this.currentStep = CartRecoveryStep.ACTION_SELECT;
      this.recoveryMode = "restore";
      return this.handleRestoreCart();
    }

    // User wants email recovery
    if (input.includes("email") || input.includes("correo")) {
      this.currentStep = CartRecoveryStep.ACTION_SELECT;
      this.recoveryMode = "email";
      return this.handleEmailRecovery();
    }

    // User wants WhatsApp recovery
    if (input.includes("whatsapp")) {
      this.currentStep = CartRecoveryStep.ACTION_SELECT;
      this.recoveryMode = "whatsapp";
      return this.handleWhatsAppRecovery();
    }

    // Default: show options again
    return this.getWelcomeResponse();
  }

  /**
   * Handle action selection step
   */
  private handleActionStep(input: string): AgentResponse {
    // This step is handled by specific action methods
    return {
      text: "Procesando tu solicitud...",
      suggestions: [],
      success: true,
    };
  }

  /**
   * Handle confirmation step
   */
  private handleConfirmStep(input: string): AgentResponse {
    if (input.includes("sí") || input.includes("si") || input.includes("yes")) {
      this.currentStep = CartRecoveryStep.COMPLETE;
      return {
        text: "¡Perfecto! Acción completada exitosamente.",
        suggestions: ["Ir al Dashboard"],
        success: true,
      };
    }

    // Cancel action
    this.currentStep = CartRecoveryStep.WELCOME;
    this.recoveryMode = "none";
    return this.getWelcomeResponse();
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return {
      currentStep: this.currentStep,
      memory: {
        currentCart: this.currentCart,
        recoveryMode: this.recoveryMode,
        abandonedCarts: this.abandonedCarts,
      },
      lastActive: new Date(),
    };
  }

  /**
   * Restore state
   */
  setState(state: AgentState): void {
    if (state.currentStep) {
      this.currentStep = state.currentStep as CartRecoveryStep;
    }

    if (state.memory) {
      this.currentCart = state.memory.currentCart || null;
      this.recoveryMode = state.memory.recoveryMode || "none";
      this.abandonedCarts = state.memory.abandonedCarts || [];
    }
  }

  /**
   * Reset agent
   */
  reset(): void {
    this.currentCart = null;
    this.recoveryMode = "none";
    this.currentStep = CartRecoveryStep.WELCOME;
    this.abandonedCarts = [];
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
        this.abandonedCarts = carts;
        if (carts.length > 0) {
          this.currentCart = carts[0]; // Focus on most recent
        }
      },
      error: (error) => {
        console.error("Failed to load abandoned carts:", error);
        this.abandonedCarts = [];
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
        suggestions: ["Volver"],
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
        tags: [],
      });
    });

    this.currentStep = CartRecoveryStep.COMPLETE;

    return {
      text: `✅ ¡Carrito restaurado exitosamente! Se han añadido ${
        this.currentCart.items.length
      } producto${
        this.currentCart.items.length > 1 ? "s" : ""
      } a tu carrito. Te llevo al menú para que puedas continuar con tu pedido.`,
      suggestions: ["Ir al Menú", "Ver Carrito"],
      success: true,
      switchToAgent: {
        agentType: "rider",
        context: {
          notification: "Carrito restaurado exitosamente",
          cart: this.cartService.cartItems(),
          returnTo: "abandoned-cart",
        },
      },
      navigate: {
        route: "/rider/chat",
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
        suggestions: ["Volver"],
        success: false,
      };
    }

    this.currentStep = CartRecoveryStep.CONFIRM;

    return {
      text: `Voy a enviar un email de recuperación al cliente con los detalles del carrito (${
        this.currentCart.items.length
      } productos, €${this.currentCart.totalValue.toFixed(
        2
      )}). ¿Confirmas el envío?`,
      suggestions: ["✅ Sí, enviar", "❌ Cancelar"],
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
        suggestions: ["Volver"],
        success: false,
      };
    }

    this.currentStep = CartRecoveryStep.CONFIRM;

    return {
      text: `Voy a enviar un mensaje de WhatsApp al cliente con los detalles del carrito (${
        this.currentCart.items.length
      } productos, €${this.currentCart.totalValue.toFixed(
        2
      )}). ¿Confirmas el envío?`,
      suggestions: ["✅ Sí, enviar", "❌ Cancelar"],
      success: true,
    };
  }
}

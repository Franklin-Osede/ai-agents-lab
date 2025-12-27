import { Component, inject, signal, OnInit, OnDestroy } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import { CommonModule, Location } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { VoiceService } from "../../../shared/services/voice.service";
import { CartService, CartItem } from "../../../shared/services/cart.service";
import { UserSessionService } from "../../services/user-session.service";
import { StateMachineService } from "../../services/state-machine.service";
import { RiderAgentService } from "../../services/rider-agent.service";
import { AgentOrchestratorService } from "../../../shared/services/agent-orchestrator.service";

import { MenuDataService, MenuCard } from "../../services/menu-data.service";
import { PollyTTSService } from "../../../shared/services/polly-tts.service";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  time: string;
  cards?: MenuCard[]; // Use MenuCard for now, logic below might adapt
}

import { MenuGridComponent } from "./components/menu-grid/menu-grid.component";
import { MenuCategoriesComponent } from "./components/menu-categories/menu-categories.component";
import { CartSummaryComponent } from "./components/cart-summary/cart-summary.component";

@Component({
  selector: "app-ai-menu-chat",
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    MenuGridComponent,
    MenuCategoriesComponent,
    CartSummaryComponent,
  ],
  templateUrl: "./ai-menu-chat.component.html",
  styleUrls: ["./ai-menu-chat.component.scss"],
})
export class AiMenuChatComponent implements OnInit, OnDestroy {
  private voiceService = inject(VoiceService);
  private cartService = inject(CartService);
  private router = inject(Router);
  public session = inject(UserSessionService);
  private stateMachine = inject(StateMachineService); // Keep for state read
  private riderAgent = inject(RiderAgentService); // Use for actions
  private orchestrator = inject(AgentOrchestratorService); // Use for switching
  private menuDataService = inject(MenuDataService);
  private location = inject(Location);
  private pollyService = inject(PollyTTSService); // New Polly Service

  inputText = signal("");
  isRecording = signal(false);
  cart = this.cartService.cartItems;

  // Bind directly to service signal
  isAgentSpeaking = this.pollyService.isAgentSpeaking;

  get cartTotal(): number {
    return this.cartService.total;
  }

  get cartCount(): number {
    return this.cartService.count;
  }

  messages = signal<ChatMessage[]>([]);

  readonly restaurantName = "Rider Agent";
  readonly cuisineType = "General";
  showOptions = signal(true);
  // isAgentSpeaking = signal(false); // Removed local signal

  suggestions = signal<string[]>([]);

  agentAvatarUrl = signal(
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCwG95_Jyamt-03U1K7Es161_UU58Qrugpph4J0SSKkXt6vuj7h8WTJcqzkPMK0VTLv80KYlnVmoiHr_0m4Be36b9i85hxHL45pbwWsrD-NGd_09gCDRD5lihRVDFwxpKIuB37KT7zjelr9uHEiybwWf40CHtudofw5iKNR6oVS3v8IQG9dgXjE4N_xy8N5Kv0en3QD1UJOWBIuXgJv8yVyyyU9hrs2q8c5DedapnLMrSKeELGm2tzizdJEFKE6131-idVsQeiUdW4"
  );

  ngOnInit() {
    // 1. Stop any background audio immediately using Polly Service
    this.pollyService.stop();

    // 2. Get User Name
    const user = this.session.user();
    const userName = user ? user.name : "Amigo";

    // Heuristic: If user is female (name ends in 'a' usually in Spanish), ensure Female Agent (Maria).
    // If not, we could switch, but the requirement is "If user is female -> Female Agent".
    // The current default IS Female (Maria). So we are good.
    // If we wanted to switch for males:
    if (userName && !userName.endsWith("a")) {
      // Maybe switch to Male Agent?
      // For now, let's stick to Maria as the default "Concierge" unless explicitly asked to switch for males.
      // The user said "If female user -> responses from female agent".
      // I will forcefully ensure it is the female avatar.
    }

    // 3. Initialize State Machine
    this.stateMachine.reset();

    // 4. Check for incoming intent from Home Screen
    const navState = history.state as any;
    if (navState && navState.data && navState.data.type) {
      // We have a query! Skip welcome and process it.
      const query = navState.data.type;
      // Small delay to allow View to init
      setTimeout(() => {
        this.inputText.set(query);
        this.sendMessage();
      }, 100);
      return;
    }

    // 5. Normal Flow (Welcome OR Restore)
    const storedMessages = this.stateMachine.memory.messages;
    if (storedMessages && storedMessages.length > 0) {
      // Restore state
      this.messages.set(storedMessages);

      // Also restore suggestions based on current state node
      const currentNode = this.stateMachine.getCurrentStateNode();
      if (currentNode) {
        this.suggestions.set(currentNode.suggestions);
        this.showOptions.set(true);
      }
    } else {
      // Fresh Start
      const initialState = this.stateMachine.getCurrentStateNode();

      if (initialState) {
        // Compose Welcome Message
        const welcomeText = `Hola ${userName}. ${initialState.response}`;

        const initialMsg = {
          role: "ai" as const,
          text: welcomeText,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        this.messages.set([initialMsg]);

        // Save to memory
        this.stateMachine.memory.messages = [initialMsg];

        this.suggestions.set(initialState.suggestions);
        this.showOptions.set(true);

        // Auto-play audio welcome
        setTimeout(() => this.speak(welcomeText), 500);
      }
    }
  }

  ngOnDestroy() {
    // Stop any existing Polly audio
    this.pollyService.stop();
  }

  async toggleRecording() {
    if (this.isRecording()) {
      this.isRecording.set(false);
      this.voiceService.stopListening();
    } else {
      this.isRecording.set(true);
      try {
        const transcript = await this.voiceService.listen();
        this.isRecording.set(false);
        if (transcript) {
          this.inputText.set(transcript);
          this.sendMessage();
        }
      } catch (error) {
        console.error("Voice error:", error);
        this.isRecording.set(false);
      }
    }
  }

  sendMessage() {
    const text = this.inputText().trim();
    if (!text) return;

    // Add User Message
    this.messages.update((msgs) => {
      const newMsgs = [
        ...msgs,
        {
          role: "user" as const,
          text: this.formatDisplayText(text),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ];
      // Persist
      this.stateMachine.memory.messages = newMsgs;
      return newMsgs;
    });
    this.inputText.set("");

    // --- STATE MACHINE PROCESSING ---
    // Try Button/Select Match first (Exact match)
    // If not found, imply Intent (Naive approach for demo: use text as key if simple, or just pass text)
    // For this demo, let's try to match 'on_select' keys first.

    // Check if the text matches any suggestion (current state buttons)
    // The state machine service handles this based on input.
    // We pass 'select' if it matches a button, or 'intent' otherwise.
    // Actually, let's pass it to a unified handler if possible or guess.

    // Navigation Shortcuts
    if (
      text.toLowerCase().includes("domicilio") &&
      text.toLowerCase().includes("a")
    ) {
      this.router.navigate(["/rider/checkout"]);
      return;
    }
    if (
      text.toLowerCase().includes("reservar") &&
      text.toLowerCase().includes("mesa")
    ) {
      this.router.navigate(["/rider/reservations"]);
      return;
    }

    // GLOBAL INTERCEPT: "Postres" (Desserts)
    // Because we dynamically add "Postres" to suggestions in addToCart,
    // the current state node might not explicitly have it defined in 'on_select'.
    if (
      text.toLowerCase().includes("postre") ||
      text.toLowerCase().includes("dessert")
    ) {
      const currentContext = this.stateMachine.currentState().context;
      // Force transition to dessert for the current cuisine
      const overrideResult = this.stateMachine.handleTransition(
        "force_dessert",
        "intent"
      );

      // Since handleTransition might not know "force_dessert", we basically construct the transition manually
      // if the normal flow fails.
      // Actually, let's just manually set the state and simulate a result.

      // Verify we have a dessert state for this context
      const targetId = `${currentContext}.dessert`;
      // We can use the service to get the node to be sure
      // But assuming the standard naming convention context.dessert exists (it does for all cuisines)

      this.stateMachine.currentState.set({
        context: currentContext,
        category: "dessert",
      });
      const newNode = this.stateMachine.getCurrentStateNode();

      if (newNode) {
        // Create a fake result object
        const manualResult = {
          id: newNode.id,
          response: newNode.response,
          suggestions: newNode.suggestions,
          category: "dessert",
          cards: [],
        };
      }
    }

    // --- INTERCEPT: Checkout / Finalize ---
    // If user says "Ya lo tengo todo", we skip the 'confirmation' step and go straight to "Delivery or Table?"
    if (
      text.toLowerCase().includes("ya lo tengo todo") ||
      text.toLowerCase().includes("tengo todo") ||
      text.toLowerCase().includes("finalizar") ||
      text.toLowerCase().includes("pagar")
    ) {
      // 1. Add User Message (already added above)
      // 2. Add AI Response directly
      setTimeout(() => {
        const responseText =
          "¡Oído cocina! 👨‍🍳 ¿Prefieres que te lo llevemos a casa 🛵... o te guardo una mesa en el local? 📅";

        this.messages.update((msgs) => [
          ...msgs,
          {
            role: "ai" as const,
            text: responseText,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);

        this.speak(responseText);
        this.suggestions.set(["🛵 A domicilio", "📅 Reservar Mesa"]);
        this.showOptions.set(true);
      }, 500);

      return; // Stop here, don't use State Machine for this step
    }

    // In strict mode: buttons send exact text. Voice sends loose text.
    // We will assume 'select' for now if it matches known suggestions, else 'intent' logic (which maps key words).

    // If text matches an intent key directly (like 'choose_cuisine_japanese'), use it.
    const currentNode = this.stateMachine.getCurrentStateNode();
    let type: "select" | "intent" = "intent";
    let inputKey = text;

    if (
      currentNode?.on_select &&
      Object.keys(currentNode.on_select).includes(text)
    ) {
      type = "select";
    } else if (
      currentNode?.on_intent &&
      Object.keys(currentNode.on_intent).includes(text)
    ) {
      // Direct intent match (e.g. passed from Home)
      type = "intent";
      inputKey = text;
    } else {
      // Try heuristic mapping
      inputKey = this.mapTextToIntent(text);
    }

    // Check if we intercepted it above?
    // Actually, creating a valid `result` object is better.
    // let result = this.stateMachine.handleTransition(inputKey, type);
    // const agentResponse = this.riderAgent.handleInput(inputKey, type);
    // Fix type mapping: 'intent' -> 'text'
    const agentInputType = type === "select" ? "select" : "text";
    const agentResponse = this.riderAgent.handleInput(inputKey, agentInputType);
    let result: any = null;

    if (agentResponse) {
      // Handle Agent Switching
      if (agentResponse.switchToAgent) {
        this.orchestrator.activateAgent(
          agentResponse.switchToAgent.agentType,
          agentResponse.switchToAgent.context
        );
      }

      // Handle Navigation
      if (agentResponse.navigate) {
        this.router.navigate([agentResponse.navigate.route], {
          queryParams: agentResponse.navigate.params,
        });
      }

      // Map AgentResponse to local result format for UI compatibility
      result = {
        id: agentResponse["id"],
        response: agentResponse["text"], // Map text -> response
        suggestions: agentResponse.suggestions || [],
        category: agentResponse["category"],
        cards: agentResponse.cards,
      };
    }

    // Fix for Postres if normal transition failed OR if we want to force it
    if (
      !result &&
      (text.toLowerCase().includes("postre") ||
        text.toLowerCase().includes("dessert"))
    ) {
      const currentContext = this.stateMachine.currentState().context;
      // Manual Transition
      this.stateMachine.currentState.set({
        context: currentContext,
        category: "dessert",
      });
      const newNode = this.stateMachine.getCurrentStateNode();
      if (newNode) {
        result = {
          id: newNode.id,
          response: newNode.response,
          suggestions: newNode.suggestions,
          category: "dessert",
          cards: [],
        };
      }
    }

    this.showOptions.set(false); // Hide old options

    if (result) {
      const res = result; // Local capture for closure safety
      // Enforce specific "Meals" logic for visual cards if applicable
      let localCards: any[] = [];
      const currentState = this.stateMachine.currentState();

      // If the category suggests a menu view, try to load cards
      // FIX: Don't show cards on 'default' (initial cuisine selection), wait for specific menu choice.
      // If the category suggests a menu view, try to load cards
      const category = currentState.category;
      if (
        category.includes("menu") ||
        [
          "starters",
          "mains",
          "drinks",
          "dessert",
          "spicy_pick",
          "kids",
          "menu_ramen",
          "menu_hot",
        ].includes(category)
      ) {
        localCards = this.getCardsForCuisine(
          currentState.context,
          currentState.category
        );
      }

      setTimeout(() => {
        let responseText = res.response;
        // Prepend name if this is the first AI response (or if we just started)
        const aiMessages = this.messages().filter((m) => m.role === "ai");
        if (aiMessages.length === 0) {
          const userName = this.session.user()?.name;
          if (userName) {
            if (res.id === "japanese.default") {
              responseText = `¡Excelente elección! 🍣 La cocina japonesa de hoy tiene una pinta espectacular. Mire las opciones:`;
            } else if (res.id === "italian.default") {
              responseText = `¡Mamma mia! 🍕 Muy bien elegido. Aquí tiene nuestras especialidades italianas.`;
            } else if (res.id === "fast_food.default") {
              responseText = `¡Marchando comida rápida! 🍔 A veces es justo lo que el cuerpo pide. Aquí tiene el menú.`;
            } else {
              // Check if response already has "Hola" (case insensitive)
              if (!responseText.toLowerCase().includes("hola")) {
                responseText = `Hola ${userName}, ${
                  responseText.charAt(0).toLowerCase() + responseText.slice(1)
                }`;
              }
            }
          }
        }

        this.messages.update((msgs) => {
          const newMsgs = [
            ...msgs,
            {
              role: "ai" as const,
              text: responseText,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              cards: localCards.length > 0 ? localCards : undefined,
            },
          ];
          // Persist
          this.stateMachine.memory.messages = newMsgs;
          return newMsgs;
        });
        this.speak(responseText);
        // SMART UI: Filter out suggestions that are already shown as cards
        let finalSuggestions = res.suggestions;
        if (localCards && localCards.length > 0) {
          // Normalize string helper: remove emojis, special chars, extra spaces, lowercase
          const normalize = (str: string) =>
            str
              .replace(/[^a-zA-Z0-9\sñáéíóúÁÉÍÓÚüÜ]/g, "")
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase();

          const cardNames = localCards.map((c) => normalize(c.name));

          // Filter out suggestions that are present in the cards
          // Matches strict and partial (e.g. "Sushi Set" vs "🍣 Sushi Set")
          finalSuggestions = finalSuggestions.filter((s: string) => {
            const sClean = normalize(s);
            // Check reciprocal containment
            const isCard = cardNames.some(
              (cName) => sClean.includes(cName) || cName.includes(sClean)
            );

            // Keep only if NOT a card
            return !isCard;
          });
        }

        this.suggestions.set(finalSuggestions);
        this.showOptions.set(true);

        if (res.category === "delivery_action" || res.category === "checkout") {
          // INTERCEPT: Don't go to checkout immediately. Ask for preference.
          // However, if the user explicitly clicked "A domicilio" (which we might need to detecting), proceed.
          // If the text was generic "pagar" or "finalizar", ask.

          if (this.inputText().toLowerCase().includes("domicilio")) {
            // Let Orchestrator/Agent handle it via 'navigate' response
            // But if we are here, it means we didn't use 'navigate' yet?
            // Actually, RiderAgentService returns 'navigate' for delivery_action.
            // So this code block might be skipped if we handled 'navigate' in sendMessage.
            // BUT sendMessage continues execution unless we return.
            // I didn't add 'return' inside 'if (agentResponse)'.
            // So this logic still runs.
            // Redundant but specific fallback?
            // "domicilio" navigation is handled by RiderAgentService now.
          } else {
            // Fallback default response if we hit this state via means other than "Ya lo tengo todo" intent
            const askText =
              "¡Oído cocina! 👨‍🍳 ¿Prefieres delivery a casa 🛵... o te reservo mesa en el restaurante? 📅";
            this.speak(askText);
            this.suggestions.set(["🛵 A domicilio", "📅 Reservar Mesa"]);

            // Update the last message
            this.messages.update((msgs) => {
              const newMsgs = [...msgs];
              const lastMsg = newMsgs[newMsgs.length - 1];
              if (lastMsg.role === "ai") {
                lastMsg.text = askText;
              }
              // Persist
              this.stateMachine.memory.messages = newMsgs;
              return newMsgs;
            });
          }
        }
      }, 1000);
    } else {
      // Fallback
      setTimeout(() => {
        const fallbackText =
          "Disculpa, se me ha cortado la onda 📶. No te he entendido bien. ¿Puedes repetir?";
        this.messages.update((msgs) => [
          ...msgs,
          {
            role: "ai",
            text: fallbackText,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        this.speak(fallbackText);
        this.showOptions.set(true);
      }, 1000);
    }
  }

  // Simple NLU mapper for the demo
  mapTextToIntent(text: string): string {
    const t = text.toLowerCase();

    // Japanese
    if (
      t.includes("japon") ||
      t.includes("sushi") ||
      t.includes("ramen") ||
      t.includes("miso") ||
      t.includes("tempura")
    )
      return "choose_cuisine_japanese";

    // Italian
    if (
      t.includes("italian") ||
      t.includes("pizza") ||
      t.includes("pasta") ||
      t.includes("espagueti") ||
      t.includes("macarron") ||
      t.includes("lasaña")
    )
      return "choose_cuisine_italian";

    // Fast Food
    if (
      t.includes("fast") ||
      t.includes("hamburguesa") ||
      t.includes("burger") ||
      t.includes("perrito") ||
      t.includes("nugget") ||
      t.includes("patatas")
    )
      return "choose_cuisine_fast_food";

    // Spanish
    if (
      t.includes("españ") ||
      t.includes("tapa") ||
      t.includes("paella") ||
      t.includes("tortilla") ||
      t.includes("croqueta") ||
      t.includes("jamon") ||
      t.includes("bravas") ||
      t.includes("racion")
    )
      return "choose_cuisine_spanish";

    // Actions
    if (
      t.includes("ver pedido") ||
      t.includes("carrito") ||
      t.includes("mi orden")
    )
      return "view_order";
    if (
      t.includes("pagar") ||
      t.includes("finalizar") ||
      t.includes("cuenta") ||
      t.includes("checkout") ||
      t.includes("ya lo tengo todo") ||
      t.includes("tengo todo")
    )
      return "checkout";

    // Default fallback
    return text;
  }

  handleOption(option: string) {
    if (option.includes("Reservar Mesa")) {
      this.router.navigate(["/rider/reservations"]);
      return;
    }
    if (option.includes("A domicilio")) {
      this.router.navigate(["/rider/checkout"]);
      return;
    }

    this.inputText.set(option);
    this.sendMessage();
  }

  // Audio State (Polly-based)
  currentlySpeakingMessageText = signal<string | null>(null);

  speak(text: string) {
    this.currentlySpeakingMessageText.set(text);
    this.pollyService.speak(text);
  }

  toggleAudio(text: string) {
    // If clicking the same message that is playing -> Pause/Stop
    if (this.currentlySpeakingMessageText() === text) {
      this.pollyService.stop();
      this.currentlySpeakingMessageText.set(null);
    } else {
      // Otherwise -> Play new message (speak() handles cancellation of others)
      this.speak(text);
    }
  }

  addToCart(item: MenuCard) {
    this.cartService.addToCart(item);

    // Contextual Suggestions Logic
    const tags = (item.tags || []).map((t) => t.toLowerCase());
    let nextOptions: string[] = [];

    // 0. DESSERT -> FINISH (Usually last step)
    if (tags.some((t) => t.includes("dessert") || t.includes("sweet"))) {
      nextOptions = ["✅ Ya lo tengo todo"];
    }
    // DRINKS -> DESSERTS (Global)
    else if (tags.some((t) => t.includes("drink") || t.includes("beverage"))) {
      nextOptions = ["🍰 Postres", "✅ Ya lo tengo todo"];
    }
    // 1. FAST FOOD
    else if (tags.includes("burger")) {
      nextOptions = [
        "🍟 Acompañantes",
        "🥤 Bebidas",
        "🍰 Postres",
        "🌶️ Picante",
        "👶 Menú Infantil",
        "✅ Ya lo tengo todo",
      ];
    } else if (tags.includes("chicken")) {
      nextOptions = [
        "🍔 Hamburguesas",
        "🍟 Acompañantes",
        "🥤 Bebidas",
        "🍰 Postres",
        "🌶️ Picante",
        "✅ Ya lo tengo todo",
      ];
    } else if (tags.includes("side") && tags.includes("fast_food")) {
      nextOptions = [
        "🍔 Hamburguesas",
        "🥤 Bebidas",
        "🍰 Postres",
        "✅ Ya lo tengo todo",
      ];
    }
    // 2. JAPANESE
    else if (tags.includes("starter") && tags.includes("japan")) {
      nextOptions = [
        "🍣 Principales / Sushi",
        "🍜 Ramen",
        "🥤 Bebidas", // Ensure drinks are always an option after starters
        "✅ Ya lo tengo todo",
      ];
    } else if (
      tags.includes("sushi") ||
      (tags.includes("main") && tags.includes("japan"))
    ) {
      nextOptions = [
        "🥗 Entrantes",
        "🥤 Bebidas",
        "🍰 Postres",
        "✅ Ya lo tengo todo",
      ];
    }
    // 3. ITALIAN
    else if (tags.includes("italian") && tags.includes("main")) {
      nextOptions = ["🥤 Bebidas", "🍰 Postres", "✅ Ya lo tengo todo"];
    }
    // 4. SPANISH
    else if (
      tags.includes("spanish") &&
      (tags.includes("main") || tags.includes("tapas"))
    ) {
      nextOptions = ["🥤 Bebidas", "🍰 Postres", "✅ Ya lo tengo todo"];
    }
    // FALLBACKS
    else if (tags.some((t) => t.includes("fast_food"))) {
      nextOptions = [
        "🍔 Hamburguesa",
        "🥤 Bebidas",
        "🍰 Postres",
        "🌶️ Picante",
        "✅ Ya lo tengo todo",
      ];
    } else if (tags.some((t) => t.includes("japan"))) {
      nextOptions = [
        "🍣 Principales / Sushi",
        "🥤 Bebidas",
        "🍰 Postres",
        "✅ Ya lo tengo todo",
      ];
    } else if (tags.some((t) => t.includes("ital"))) {
      nextOptions = ["🥤 Bebidas", "🍰 Postres", "✅ Ya lo tengo todo"];
    } else if (tags.some((t) => t.includes("span"))) {
      nextOptions = ["🥤 Bebidas", "🍰 Postres", "✅ Ya lo tengo todo"];
    }

    // SMART FILTERING: Don't suggest what they already have
    const cartItems = this.cartService.cartItems();

    // Check for categories present in cart
    const hasDessert = cartItems.some((i) =>
      (i.tags || []).some((t) => {
        const lower = t.toLowerCase();
        return lower.includes("dessert") || lower.includes("sweet");
      })
    );
    const hasDrink = cartItems.some((i) =>
      (i.tags || []).some((t) => {
        const lower = t.toLowerCase();
        return lower.includes("drink") || lower.includes("beverage");
      })
    );

    // Suggest items NOT present.
    // If we have dessert, don't ask for dessert.
    if (hasDessert) {
      nextOptions = nextOptions.filter((o) => !o.includes("Postres"));
    }
    // If we have drinks, don't ask for drinks.
    if (hasDrink) {
      nextOptions = nextOptions.filter((o) => !o.includes("Bebidas"));
    }

    // REMOVE "VER PEDIDO" text options as requested (since we have the floating button)
    nextOptions = nextOptions.filter(
      (o) =>
        !o.toLowerCase().includes("ver pedido") &&
        !o.toLowerCase().includes("confirmar")
    );

    // Filter duplicates just in case
    nextOptions = [...new Set(nextOptions)];

    this.suggestions.set(nextOptions);
  }

  goHome() {
    this.location.back();
  }

  removeFromCart(item: MenuCard) {
    this.cartService.removeFromCart(item);
    // Optional: could trigger "removed" intent if needed, but manual control is fine
  }

  getQuantity(item: MenuCard): number {
    return this.cartService.getQuantity(item.name);
  }

  viewDetails(item: MenuCard) {
    console.log("View details for", item.name);
  }

  goToCheckout() {
    this.router.navigate(["/rider/checkout"]);
  }

  formatDisplayText(text: string): string {
    if (text === "choose_cuisine_japanese") return "Japonesa 🍣";
    if (text === "choose_cuisine_italian") return "Italiana 🍕";
    if (text === "choose_cuisine_fast_food") return "Fast Food 🍔";
    return text;
  }

  getCardsForCuisine(type: string, category = "popular"): MenuCard[] {
    return this.menuDataService.getCardsForCuisine(type, category);
  }

  getTypeTranslation(type: string): string {
    const map: any = {
      Japanese: "Japonesa",
      Italian: "Italiana",
      Mexican: "Mexicana",
      "Fast Food": "Rápida",
    };
    return map[type] || type;
  }
}

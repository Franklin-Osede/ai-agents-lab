import { Component, inject, signal, OnInit, OnDestroy } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import { CommonModule, Location } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { VoiceService } from "../../../shared/services/voice.service";
import { CartService, CartItem } from "../../../shared/services/cart.service";
import { UserSessionService } from "../../services/user-session.service";
import { StateMachineService } from "../../services/state-machine.service";

interface MenuCard extends CartItem {
  bestValue?: boolean;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  time: string;
  cards?: MenuCard[]; // Use MenuCard for now, logic below might adapt
}

@Component({
  selector: "app-ai-menu-chat",
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: "./ai-menu-chat.component.html",
  styleUrls: ["./ai-menu-chat.component.scss"],
})
export class AiMenuChatComponent implements OnInit, OnDestroy {
  private voiceService = inject(VoiceService);
  private cartService = inject(CartService);
  private router = inject(Router);
  public session = inject(UserSessionService);
  private stateMachine = inject(StateMachineService); // Inject State Machine
  private location = inject(Location);

  inputText = signal("");
  isRecording = signal(false);
  cart = this.cartService.cartItems;

  get cartTotal(): number {
    return this.cartService.total;
  }

  get cartCount(): number {
    return this.cartService.count;
  }

  messages = signal<ChatMessage[]>([]);

  restaurantName = "Rider Agent";
  cuisineType = "General";
  showOptions = signal(true);
  isAgentSpeaking = signal(false);

  suggestions = signal<string[]>([]);

  agentAvatarUrl = signal(
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCwG95_Jyamt-03U1K7Es161_UU58Qrugpph4J0SSKkXt6vuj7h8WTJcqzkPMK0VTLv80KYlnVmoiHr_0m4Be36b9i85hxHL45pbwWsrD-NGd_09gCDRD5lihRVDFwxpKIuB37KT7zjelr9uHEiybwWf40CHtudofw5iKNR6oVS3v8IQG9dgXjE4N_xy8N5Kv0en3QD1UJOWBIuXgJv8yVyyyU9hrs2q8c5DedapnLMrSKeELGm2tzizdJEFKE6131-idVsQeiUdW4"
  );

  ngOnInit() {
    // 1. Stop any background audio immediately
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

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
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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
          "¿Cómo prefieres disfrutar tu pedido? ¿A domicilio 🛵 o Reservar Mesa 📅?";

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
    let result = this.stateMachine.handleTransition(inputKey, type);

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
              responseText = `Perfecto ${userName}, veo que quieres comer japonesa 🍣. Elige entre las opciones de abajo:`;
            } else if (res.id === "italian.default") {
              responseText = `Perfecto ${userName}, veo que te apetece italiana 🍕. Elige entre las opciones de abajo:`;
            } else if (res.id === "fast_food.default") {
              responseText = `Perfecto ${userName}, marchando Fast Food 🍔. Elige entre las opciones de abajo:`;
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
          finalSuggestions = finalSuggestions.filter((s) => {
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

        // Check for new items in StateMachine memory to add to CartService
        const lastItem =
          this.stateMachine.memory.order[
            this.stateMachine.memory.order.length - 1
          ];
        if (lastItem && !this.cart().find((i) => i.name === lastItem.name)) {
          this.cartService.addToCart({
            id: Date.now().toString(),
            name: lastItem.name,
            price: 10.0, // Mock price
            quantity: 1,
            image: "assets/food_images/caesar_salad.webp", // Mock image
          });
        }

        // Check for Navigation Triggers
        if (res.category === "reservation_entry") {
          // Detect Trigger
          setTimeout(() => {
            this.router.navigate(["/rider/reservations"]);
          }, 1000);
        }

        if (res.category === "delivery_action" || res.category === "checkout") {
          // INTERCEPT: Don't go to checkout immediately. Ask for preference.
          // However, if the user explicitly clicked "A domicilio" (which we might need to detecting), proceed.
          // If the text was generic "pagar" or "finalizar", ask.

          if (this.inputText().toLowerCase().includes("domicilio")) {
            setTimeout(() => {
              this.router.navigate(["/rider/checkout"]);
            }, 1000);
          } else {
            // Fallback default response if we hit this state via means other than "Ya lo tengo todo" intent
            const askText =
              "¿Prefieres que te lo levemos a casa 🛵 o quieres reservar una mesa 📅?";
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
          "Lo siento, no he entendido. Por favor selecciona una opción.";
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

  // Audio State
  currentUtterance: SpeechSynthesisUtterance | null = null;
  currentlySpeakingMessageText = signal<string | null>(null);

  speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Stop any current audio first
    window.speechSynthesis.cancel();
    this.currentUtterance = null;
    this.currentlySpeakingMessageText.set(null);
    this.isAgentSpeaking.set(false);

    const utterance = new SpeechSynthesisUtterance(text);
    // CRITICAL: Set language so browser can auto-select if manual selection fails
    utterance.lang = "es-ES";

    const voices = window.speechSynthesis.getVoices();
    this.applyVoiceAndSpeak(utterance, voices);
  }

  private applyVoiceAndSpeak(
    utterance: SpeechSynthesisUtterance,
    voices: SpeechSynthesisVoice[]
  ) {
    // 1. Try preferred Spanish voices (Google, Monica, Paulina)
    let spanishVoice = voices.find(
      (v) =>
        v.lang.includes("es") &&
        (v.name.includes("Google") ||
          v.name.includes("Monica") ||
          v.name.includes("Paulina"))
    );

    // 2. Fallback to ANY Spanish voice
    if (!spanishVoice) {
      spanishVoice = voices.find((v) => v.lang.includes("es"));
    }

    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = () => {
      this.isAgentSpeaking.set(true);
      this.currentlySpeakingMessageText.set(utterance.text);
    };

    utterance.onend = () => {
      this.isAgentSpeaking.set(false);
      this.currentlySpeakingMessageText.set(null);
      this.currentUtterance = null;
    };

    utterance.onerror = (e) => {
      console.error("Speech error", e);
      this.isAgentSpeaking.set(false);
      this.currentlySpeakingMessageText.set(null);
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  toggleAudio(text: string) {
    // If clicking the same message that is playing -> Pause/Stop
    if (this.currentlySpeakingMessageText() === text) {
      window.speechSynthesis.cancel();
      this.currentlySpeakingMessageText.set(null);
      this.isAgentSpeaking.set(false);
      this.currentUtterance = null;
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
    // Helper to use local assets
    const img = (filename: string) => `assets/food_images/${filename}`;

    if (type.includes("japan") || type.includes("sushi")) {
      if (category === "starters") {
        return [
          {
            name: "Edamame",
            price: 4.5,
            image: img("edamame.webp"),
            tags: ["japan", "starter", "Healthy"],
            description: "Habas de soja al vapor con sal.",
          },
          {
            name: "Gyoza",
            price: 6.0,
            image: img("gyoza.webp"),
            tags: ["japan", "starter", "Hot"],
            description: "Empanadillas de carne y verduras.",
          },
          {
            name: "Sopa Miso",
            price: 3.5,
            image: img("miso_soup.webp"),
            tags: ["japan", "starter", "Warm"],
            description: "Sopa tradicional con tofu y algas.",
          },
        ];
      }
      if (
        category === "mains" ||
        category === "menu" ||
        category === "added_starter" ||
        category === "added_main"
      ) {
        return [
          {
            name: "Sushi Set Deluxe",
            price: 18.0,
            image: img("sushi_set.webp"),
            tags: ["japan", "sushi", "main", "Premium"],
            description: "Variado de 12 piezas de Nigiris y Makis.",
          },
          {
            name: "Katsu Curry",
            price: 14.0,
            image: img("katsu_curry.webp"),
            tags: ["japan", "main", "Hot"],
            description: "Curry japonés con cerdo empanado y arroz.",
          },
          {
            name: "Bento Box",
            price: 16.5,
            image: img("bento_box.webp"),
            tags: ["japan", "main", "Value"],
            description: "Caja completa con arroz, pollo y guarnición.",
          },
        ];
      }
      if (category === "kids") {
        return [
          {
            name: "Chicken Teriyaki Bowl",
            price: 9.5,
            image: img("chicken_teriyaki.webp"),
            tags: ["Kids"],
            description: "Pollo a la parrilla con salsa dulce y arroz.",
          },
          {
            name: "Cucumber Roll",
            price: 5.5,
            image: img("cucumber_roll.webp"),
            tags: ["Mild"],
            description: "Rollitos sencillos de pepino.",
          },
          {
            name: "Mini Ramen",
            price: 8.0,
            image: img("mini_ramen.webp"),
            tags: ["Warm"],
            description: "Pequeña porción de sopa de fideos.",
          },
          {
            name: "Edamame",
            price: 4.0,
            image: img("edamame.webp"),
            tags: ["Healthy"],
            description: "Habas de soja al vapor.",
          },
          {
            name: "Tamago Sushi",
            price: 4.5,
            image: img("tamago_sushi.webp"),
            tags: ["Sweet"],
            description: "Tortilla dulce sobre arroz.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Mochi Ice Cream",
            price: 6.5,
            image: img("mochi.webp"),
            tags: ["Sweet"],
            description: "Pastel de arroz relleno de helado.",
          },
          {
            name: "Matcha Cheesecake",
            price: 7.5,
            image: img("matcha_cheesecake.webp"),
            tags: ["Creamy"],
            description: "Tarta de queso con té verde.",
          },
          {
            name: "Dorayaki",
            price: 5.5,
            image: img("dorayaki.webp"),
            tags: ["Classic"],
            description: "Sándwich de tortitas con judía roja.",
          },
        ];
      }
      if (category === "spicy") {
        return [
          {
            name: "Volcano Roll",
            price: 15.0,
            image: img("volcano_roll.webp"),
            tags: ["Hot", "Spicy"],
            description: "Roll de atún con salsa picante.",
          },
          {
            name: "Spicy Ramen",
            price: 13.5,
            image: img("spicy_ramen.webp"),
            tags: ["Hot"],
            description: "Caldo rico con aceite de chile.",
          },
          {
            name: "Dynamite Roll",
            price: 14.5,
            image: img("dynamite_roll.webp"),
            tags: ["Spicy"],
            description: "Tempura de gamba con mayonesa picante.",
          },
        ];
      }
      if (category === "drinks") {
        return [
          {
            name: "Asahi Beer",
            price: 6.0,
            image: img("asahi.webp"),
            tags: ["japan", "drink", "Alcohol"],
            description: "Cerveza japonesa refrescante.",
          },
          {
            name: "Sake Caliente",
            price: 8.5,
            image: img("sake.webp"),
            tags: ["japan", "drink", "Warm"],
            description: "Vino de arroz tradicional.",
          },
          {
            name: "Ramune",
            price: 4.0,
            image: img("ramune.webp"),
            tags: ["japan", "drink", "Soda"],
            description: "Refresco japonés con canica.",
          },
        ];
      }
      return [
        {
          name: "Salmon Nigiri Set",
          price: 14.5,
          image: img("salmon_nigiri.webp"),
          tags: ["Fresh", "Best Seller"],
          bestValue: true,
          description: "Salmón fresco sobre arroz sazonado.",
        },
        {
          name: "Spicy Tuna Roll",
          price: 11.0,
          image: img("spicy_tuna.webp"),
          tags: ["Spicy"],
          description: "Atún con mayonesa picante y pepino.",
        },
        {
          name: "Dragon Roll",
          price: 16.0,
          image: img("dragon_roll.webp"),
          tags: ["Chef's Pick"],
          description: "Anguila y pepino cubierto de aguacate.",
        },
        {
          name: "Miso Soup",
          price: 4.5,
          image: img("miso_soup.webp"),
          tags: ["Warm"],
          description: "Sopa tradicional de soja con tofu.",
        },
        {
          name: "Tempura Udon",
          price: 13.5,
          image: img("tempura_udon.webp"),
          tags: ["Hot"],
          description: "Fideos gruesos en caldo con tempura.",
        },
      ];
    } else if (type.includes("italian") || type.includes("pizza")) {
      if (category === "kids") {
        return [
          {
            name: "Mini Margherita",
            price: 8.5,
            image: img("mini_margherita.webp"),
            tags: ["Kids"],
            description: "Pequeña pizza de queso y tomate.",
          },
          {
            name: "Spaghetti Bambino",
            price: 9.0,
            image: img("spaghetti_bambino.webp"),
            tags: ["Mild"],
            description: "Pasta con salsa suave de tomate.",
          },
          {
            name: "Macarrones Queso",
            price: 9.5,
            image: img("mac_cheese.webp"),
            tags: ["Cheesy"],
            description: "Pasta con mucha salsa de queso.",
          },
        ];
      }
      if (category === "drinks") {
        return [
          {
            name: "Chianti Classico",
            price: 7.0,
            image: img("chianti.webp"),
            tags: ["italian", "drink", "Alcohol"],
            description: "Vino tinto de la Toscana.",
          },
          {
            name: "Peroni Nastro",
            price: 5.0,
            image: img("peroni.webp"),
            tags: ["italian", "drink", "Alcohol"],
            description: "Cerveza italiana premium.",
          },
          {
            name: "Limoncello",
            price: 4.5,
            image: img("limoncello.webp"),
            tags: ["italian", "drink", "Alcohol"],
            description: "Licor de limón refrescante.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Tiramisu",
            price: 8.0,
            image: img("tiramisu.webp"),
            tags: ["italian", "dessert", "Dessert"],
            description: "Postre italiano con café y mascarpone.",
          },
          {
            name: "Panna Cotta",
            price: 7.5,
            image: img("panna_cotta.webp"),
            tags: ["italian", "dessert", "Creamy"],
            description: "Crema de nata con frutos rojos.",
          },
          {
            name: "Cannoli",
            price: 6.0,
            image: img("cannoli.webp"),
            tags: ["italian", "dessert", "Crispy"],
            description: "Masa frita rellena de ricotta dulce.",
          },
        ];
      }
      return [
        {
          name: "Margherita Pizza",
          price: 13.9,
          image: img("pizza_margherita.webp"),
          tags: ["italian", "main", "Vegetarian"],
          description: "Tomate, mozzarella y albahaca fresca.",
        },
        {
          name: "Carbonara",
          price: 15.5,
          image: img("carbonara.webp"),
          tags: ["italian", "main", "Creamy"],
          description: "Pasta con huevo, queso pecorino y guanciale.",
        },
        {
          name: "Lasagna",
          price: 16.0,
          image: img("lasagna.webp"),
          tags: ["italian", "main", "Hearty"],
          description: "Capas de pasta con salsa de carne y bechamel.",
        },
        {
          name: "Risotto Funghi",
          price: 18.0,
          image: img("risotto_funghi.webp"),
          tags: ["italian", "main", "Creamy"],
          description: "Arroz cremoso con selección de setas.",
        },
      ];
    } else if (type.includes("spanish")) {
      if (category === "kids") {
        return [
          {
            name: "Tortilla Francesa",
            price: 5.0,
            image: img("tortilla_francesa.webp"),
            tags: ["Kids"],
            description: "Tortilla simple con pan.",
          },
          {
            name: "Croquetas de Jamón",
            price: 8.0,
            image: img("croquetas.webp"),
            tags: ["Classic"],
            description: "Croquetas caseras cremosas.",
          },
        ];
      }
      if (category === "spicy") {
        return [
          {
            name: "Patatas Bravas",
            price: 6.5,
            image: img("patatas_bravas.webp"),
            tags: ["Spicy", "Tapas"],
            description: "Patatas fritas con salsa picante.",
          },
          {
            name: "Chorizo a la Sidra",
            price: 9.0,
            image: img("chorizo_sidra.webp"),
            tags: ["Spicy", "Hot"],
            description: "Chorizo cocido en sidra natural.",
          },
        ];
      }
      if (category === "drinks") {
        return [
          {
            name: "Vino Rioja",
            price: 4.5,
            image: img("vino_rioja.webp"),
            tags: ["spanish", "drink", "Alcohol"],
            description: "Copa de vino tinto.",
          },
          {
            name: "Cerveza",
            price: 3.5,
            image: img("cerveza.webp"),
            tags: ["spanish", "drink", "Alcohol", "Cold"],
            description: "Caña de cerveza rubia.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Crema Catalana",
            price: 6.0,
            image: img("crema_catalana.webp"),
            tags: ["spanish", "dessert", "Sweet"],
            description: "Crema pastelera con azúcar quemado.",
          },
          {
            name: "Churros",
            price: 6.5,
            image: img("churros.webp"),
            tags: ["spanish", "dessert", "Sweet"],
            description: "Masa frita con chocolate caliente.",
          },
        ];
      }
      return [
        {
          name: "Jamón Ibérico",
          price: 22.0,
          image: img("jamon_iberico.webp"),
          tags: ["spanish", "main", "Premium"],
          description: "Jamón curado de bellota cortado a mano.",
        },
        {
          name: "Patatas Bravas",
          price: 8.5,
          image: img("patatas_bravas.webp"),
          tags: ["spanish", "main", "Spicy"],
          description: "Patatas fritas con salsa picante.",
        },
        {
          name: "Paella Mixta",
          price: 18.0,
          image: img("paella.webp"),
          tags: ["spanish", "main", "Classic"],
          description: "Arroz con marisco y pollo.",
        },
        {
          name: "Tortilla Española",
          price: 9.0,
          image: img("tortilla_espanola.webp"),
          tags: ["spanish", "main", "Vegetarian"],
          description: "Tortilla de patatas y huevo.",
        },
        {
          name: "Croquetas",
          price: 10.0,
          image: img("croquetas.webp"),
          tags: ["spanish", "tapas"],
          description: "Bechamel cremosa con jamón frita.",
        },
      ];
    } else {
      // Burgers / Fast Food / Chicken
      if (category === "kids") {
        return [
          {
            name: "Kids Burger",
            price: 7.99,
            image: img("kids_burger.webp"),
            tags: ["Kids"],
            description: "Hamburguesa sencilla con ketchup.",
          },
          {
            name: "Mac & Cheese",
            price: 6.99,
            image: img("mac_cheese.webp"),
            tags: ["Cheesy"],
            description: "Macarrones con salsa de queso.",
          },
          {
            name: "Nuggets",
            price: 6.5,
            image: img("nuggets.webp"),
            tags: ["Crunchy"],
            description: "Trocitos de pollo empanado.",
          },
        ];
      }
      if (category === "spicy") {
        return [
          {
            name: "Diablo Burger",
            price: 14.99,
            image: img("diablo_burger.webp"),
            tags: ["Hot"],
            description: "Con chiles jalapeños y salsa picante.",
          },
          {
            name: "Spicy Wings",
            price: 11.99,
            image: img("spicy_wings.webp"),
            tags: ["Hot"],
            description: "Alitas bañadas en salsa buffalo.",
          },
        ];
      }
      if (category === "drinks") {
        return [
          {
            name: "Cola",
            price: 3.0,
            image: img("cola.webp"),
            tags: ["fast_food", "drink", "Soda", "Cold"],
            description: "Refresco de cola con hielo.",
          },
          {
            name: "Batido de Fresa",
            price: 4.5,
            image: img("strawberry_shake.webp"),
            tags: ["fast_food", "drink", "Sweet", "Cold"],
            description: "Batido cremoso de fresa.",
          },
          {
            name: "Agua Mineral",
            price: 2.0,
            image: img("mineral_water.webp"),
            tags: ["fast_food", "drink", "Water"],
            description: "Agua mineral natural.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Helado Sundae",
            price: 4.5,
            image: img("sundae.webp"),
            tags: ["fast_food", "dessert", "Cold"],
            description: "Helado de vainilla con sirope.",
          },
          {
            name: "Brownie",
            price: 5.0,
            image: img("brownie.webp"),
            tags: ["fast_food", "dessert", "Sweet"],
            description: "Bizcocho de chocolate templado.",
          },
        ];
      }

      // -- NEW CATEGORIES --
      if (category === "menu_chicken") {
        return [
          {
            name: "Chicken Wings",
            price: 10.99,
            image: img("chicken_wings.webp"),
            tags: ["fast_food", "chicken", "main", "Fried"],
            description: "Alitas de pollo crujientes.",
          },
          {
            name: "Crispy Chicken Sandwich",
            price: 11.5,
            image: img("chicken_sandwich.webp"),
            tags: ["fast_food", "chicken", "main", "Popular"],
            description: "Sandwich de pollo frito.",
          },
          {
            name: "Chicken Tenders",
            price: 9.99,
            image: img("chicken_tenders.webp"),
            tags: ["fast_food", "chicken", "main", "Kids"],
            description: "Tiras de pechuga empanadas.",
          },
        ];
      }

      if (category === "menu_sides" || category === "starters") {
        return [
          {
            name: "Fries",
            price: 4.99,
            image: img("fries.webp"),
            tags: ["fast_food", "side", "Side"],
            description: "Patatas fritas clásicas.",
          },
          {
            name: "Onion Rings",
            price: 5.5,
            image: img("onion_rings.webp"),
            tags: ["fast_food", "side", "Side"],
            description: "Aros de cebolla rebozados.",
          },
          {
            name: "Caesar Salad",
            price: 8.5,
            image: img("caesar_salad.webp"),
            tags: ["fast_food", "side", "Healthy"],
            description: "Ensalada César fresca.",
          },
        ];
      }

      // Default: Burgers (menu_burger or generic)
      return [
        {
          name: "Classic Smash",
          price: 12.99,
          image: img("burger_smash.webp"),
          tags: ["fast_food", "burger", "main", "Popular"],
          description: "Doble carne con queso fundido.",
        },
        {
          name: "Truffle Burger",
          price: 15.5,
          image: img("burger_truffle.webp"),
          tags: ["fast_food", "burger", "main", "Gourmet", "Best Value"],
          bestValue: true,
          description: "Hamburguesa con mayonesa de trufa.",
        },
        {
          name: "Bacon Cheese",
          price: 13.99,
          image: img("burger_bacon.webp"),
          tags: ["fast_food", "burger", "main", "Rich"],
          description: "Hamburguesa con bacon crujiente.",
        },
      ];
    }
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

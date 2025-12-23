import { Component, inject, signal, OnInit, OnDestroy } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
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

    // 5. Normal Flow (Welcome)
    const initialState = this.stateMachine.getCurrentStateNode();

    if (initialState) {
      // Compose Welcome Message
      const welcomeText = `Hola ${userName}. ${initialState.response}`;

      this.messages.set([
        {
          role: "ai",
          text: welcomeText,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      this.suggestions.set(initialState.suggestions);
      this.showOptions.set(true);

      // Auto-play audio welcome
      setTimeout(() => this.speak(welcomeText), 500);
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
    this.messages.update((msgs) => [
      ...msgs,
      {
        role: "user",
        text: this.formatDisplayText(text),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    this.inputText.set("");

    // --- STATE MACHINE PROCESSING ---
    // Try Button/Select Match first (Exact match)
    // If not found, imply Intent (Naive approach for demo: use text as key if simple, or just pass text)
    // For this demo, let's try to match 'on_select' keys first.

    // Check if the text matches any suggestion (current state buttons)
    // The state machine service handles this based on input.
    // We pass 'select' if it matches a button, or 'intent' otherwise.
    // Actually, let's pass it to a unified handler if possible or guess.

    // In strict mode: buttons send exact text. Voice sends loose text.
    // We will assume 'select' for now if it matches known suggestions, else 'intent' logic (which maps key words).

    // *Correction*: The user's JSON has on_select keys like "🍣 Japonesa".
    // If user types "Japonesa", we should match "🍣 Japonesa" if possible or mapped.
    // For simplicity, handleTransition will take the raw text.

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

    const result = this.stateMachine.handleTransition(inputKey, type);
    this.showOptions.set(false); // Hide old options

    if (result) {
      // Enforce specific "Meals" logic for visual cards if applicable
      let localCards: any[] = [];
      const currentState = this.stateMachine.currentState();

      // If the category suggests a menu view, try to load cards
      // FIX: Don't show cards on 'default' (initial cuisine selection), wait for specific menu choice.
      if (currentState.category.includes("menu")) {
        localCards = this.getCardsForCuisine(
          currentState.context,
          currentState.category
        );
      }

      setTimeout(() => {
        let responseText = result.response;
        // Prepend name if this is the first AI response (or if we just started)
        const aiMessages = this.messages().filter((m) => m.role === "ai");
        if (aiMessages.length === 0) {
          const userName = this.session.user()?.name;
          if (userName) {
            if (result.id === "japanese.default") {
              responseText = `Perfecto ${userName}, veo que quieres comer japonesa 🍣. Elige entre las opciones de abajo:`;
            } else if (result.id === "italian.default") {
              responseText = `Perfecto ${userName}, veo que te apetece italiana 🍕. Elige entre las opciones de abajo:`;
            } else if (result.id === "fast_food.default") {
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

        this.messages.update((msgs) => [
          ...msgs,
          {
            role: "ai",
            text: responseText,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            cards: localCards.length > 0 ? localCards : undefined,
          },
        ]);
        this.speak(responseText);
        this.suggestions.set(result.suggestions);
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
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", // Mock image
          });
        }

        // Check for Navigation Triggers
        if (result.category === "reservation_entry") {
          // Detect Trigger
          setTimeout(() => {
            this.router.navigate(["/rider/reservations"]);
          }, 1000);
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
      t.includes("checkout")
    )
      return "checkout";

    // Default fallback
    return text;
  }

  handleOption(option: string) {
    this.inputText.set(option);
    this.sendMessage();
  }

  // Audio State
  currentUtterance: SpeechSynthesisUtterance | null = null;
  currentlySpeakingMessageText = signal<string | null>(null);

  speak(text: string) {
    if (!("speechSynthesis" in window)) return;

    // Stop any current audio first (Mutex)
    window.speechSynthesis.cancel();
    this.currentUtterance = null;
    this.currentlySpeakingMessageText.set(null);
    this.isAgentSpeaking.set(false);

    const utterance = new SpeechSynthesisUtterance(text);
    // Try to select a Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(
      (v) =>
        v.lang.includes("es") &&
        (v.name.includes("Google") ||
          v.name.includes("Monica") ||
          v.name.includes("Paulina"))
    );
    if (spanishVoice) utterance.voice = spanishVoice;

    utterance.onstart = () => {
      this.isAgentSpeaking.set(true);
      this.currentlySpeakingMessageText.set(text);
    };

    utterance.onend = () => {
      this.isAgentSpeaking.set(false);
      this.currentlySpeakingMessageText.set(null);
      this.currentUtterance = null;
    };

    utterance.onerror = () => {
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
  }

  removeFromCart(item: MenuCard) {
    this.cartService.removeFromCart(item);
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
    // Helper to get reliable Unsplash URL
    const img = (id: string) =>
      `https://images.unsplash.com/photo-${id}?w=500&auto=format&fit=crop`;

    if (type.includes("japan") || type.includes("sushi")) {
      if (category === "starters") {
        return [
          {
            name: "Edamame",
            price: 4.5,
            image: img("1524594152303-9fd13543fe6e"),
            tags: ["Healthy"],
            description: "Habas de soja al vapor.",
          },
          {
            name: "Gyoza",
            price: 6.0,
            image: img("1541544744-378ca6f04085"),
            tags: ["Hot"],
            description: "Empanadillas de carne.",
          },
          {
            name: "Sopa Miso",
            price: 3.5,
            image: img("1547592180-85f173990554"),
            tags: ["Warm"],
            description: "Sopa tradicional.",
          },
        ];
      }
      if (category === "mains" || category === "menu") {
        return [
          {
            name: "Sushi Set Deluxe",
            price: 18.0,
            image: img("1579871494447-9811cf80d66c"),
            tags: ["Premium"],
            description: "Variado de Nigiris y Makis.",
          },
          {
            name: "Katsu Curry",
            price: 14.0,
            image: img("1563484227706-53d92fb9c56f"),
            tags: ["Hot"],
            description: "Curry japonés con cerdo empanado.",
          },
          {
            name: "Bento Box",
            price: 16.5,
            image: img("1623961817344-672dc6788db3"),
            tags: ["Value"],
            description: "Caja completa con arroz y pollo.",
          },
        ];
      }
      if (category === "kids") {
        return [
          {
            name: "Chicken Teriyaki Bowl",
            price: 9.5,
            image: img("1563484227706-53d92fb9c56f"),
            tags: ["Kids"],
            description: "Pollo a la parrilla con salsa dulce y arroz.",
          },
          {
            name: "Cucumber Roll",
            price: 5.5,
            image: img("1559847844-5315695dadae"),
            tags: ["Mild"],
            description: "Rollitos sencillos de pepino.",
          },
          {
            name: "Mini Ramen",
            price: 8.0,
            image: img("1547592180-85f173990554"),
            tags: ["Warm"],
            description: "Pequeña porción de sopa de fideos.",
          },
          {
            name: "Edamame",
            price: 4.0,
            image: img("1524594152303-9fd13543fe6e"),
            tags: ["Healthy"],
            description: "Habas de soja al vapor.",
          },
          {
            name: "Tamago Sushi",
            price: 4.5,
            image: img("1579584425555-c3ce17fd4351"),
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
            image: img("1623595119708-26b1f2b61dc4"),
            tags: ["Sweet"],
            description: "Pastel de arroz relleno de helado.",
          },
          {
            name: "Matcha Cheesecake",
            price: 7.5,
            image: img("1565557623262-b51c2513a641"),
            tags: ["Creamy"],
            description: "Tarta de queso con té verde.",
          },
          {
            name: "Dorayaki",
            price: 5.5,
            image: img("1586522502809-c12e584a78d0"),
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
            image: img("1617196034421-24e74917a035"),
            tags: ["Hot", "Spicy"],
            description: "Roll de atún con salsa picante.",
          },
          {
            name: "Spicy Ramen",
            price: 13.5,
            image: img("1569718212165-3a8278d5f624"),
            tags: ["Hot"],
            description: "Caldo rico con aceite de chile.",
          },
          {
            name: "Dynamite Roll",
            price: 14.5,
            image: img("1615887023516-9b6c504c9527"),
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
            image: img("1585553616435-2dc0a54e271d"),
            tags: ["Alcohol"],
            description: "Cerveza japonesa refrescante.",
          },
          {
            name: "Sake Caliente",
            price: 8.5,
            image: img("1580556606083-d527a051d95c"),
            tags: ["Warm"],
            description: "Vino de arroz tradicional.",
          },
          {
            name: "Ramune",
            price: 4.0,
            image: img("1566847438217-76e82d383f84"),
            tags: ["Soda"],
            description: "Refresco japonés con canica.",
          },
        ];
      }
      return [
        {
          name: "Salmon Nigiri Set",
          price: 14.5,
          image: img("1579871494447-9811cf80d66c"),
          tags: ["Fresh", "Best Seller"],
          bestValue: true,
          description: "Salmón fresco sobre arroz sazonado.",
        },
        {
          name: "Spicy Tuna Roll",
          price: 11.0,
          image: img("1553621042-f6e147245754"),
          tags: ["Spicy"],
          description: "Atún con mayonesa picante y pepino.",
        },
        {
          name: "Dragon Roll",
          price: 16.0,
          image: img("1611143669185-af224c5e3252"),
          tags: ["Chef's Pick"],
          description: "Anguila y pepino cubierto de aguacate.",
        },
        {
          name: "Miso Soup",
          price: 4.5,
          image: img("1547592180-85f173990554"),
          tags: ["Warm"],
          description: "Sopa tradicional de soja con tofu.",
        },
        {
          name: "Tempura Udon",
          price: 13.5,
          image: img("1552611052-33e04de081de"),
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
            image: img("1513104890138-7c749659a591"),
            tags: ["Kids"],
            description: "Pequeña pizza de queso y tomate.",
          },
          {
            name: "Spaghetti Bambino",
            price: 9.0,
            image: img("1608219992759-8d74ed8d76eb"),
            tags: ["Mild"],
            description: "Pasta con salsa suave de tomate.",
          },
          {
            name: "Macarrones Queso",
            price: 9.5,
            image: img("1587569192938-34661b3699b8"),
            tags: ["Cheesy"],
            description: "Pasta con mucha salsa de queso.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Tiramisu",
            price: 8.0,
            image: img("1571877227200-a0d98ea607e9"),
            tags: ["Dessert"],
            description: "Postre italiano con café y mascarpone.",
          },
          {
            name: "Panna Cotta",
            price: 7.5,
            image: img("1488477181946-6428a0291777"),
            tags: ["Creamy"],
            description: "Crema de nata con frutos rojos.",
          },
          {
            name: "Cannoli",
            price: 6.0,
            image: img("1616260855210-9556886e04d4"),
            tags: ["Crispy"],
            description: "Masa frita rellena de ricotta dulce.",
          },
        ];
      }
      return [
        {
          name: "Margherita Pizza",
          price: 13.9,
          image: img("1574071318508-1cdbab80d002"),
          tags: ["Vegetarian"],
          description: "Tomate, mozzarella y albahaca fresca.",
        },
        {
          name: "Carbonara",
          price: 15.5,
          image: img("1612874742237-6526221588e3"),
          tags: ["Creamy"],
          description: "Pasta con huevo, queso pecorino y guanciale.",
        },
        {
          name: "Lasagna",
          price: 16.0,
          image: img("1574868291534-18cd5700fa40"),
          tags: ["Hearty"],
          description: "Capas de pasta con salsa de carne y bechamel.",
        },
        {
          name: "Risotto Funghi",
          price: 18.0,
          image: img("1476124369491-e7addf5db371"),
          tags: ["Creamy"],
          description: "Arroz cremoso con selección de setas.",
        },
      ];
    } else if (type.includes("spanish")) {
      if (category === "kids") {
        return [
          {
            name: "Tortilla Francesa",
            price: 5.0,
            image: img("1584278860047-22db9ff82bed"),
            tags: ["Kids"],
            description: "Tortilla simple con pan.",
          },
          {
            name: "Croquetas de Jamón",
            price: 8.0,
            image: img("1626806554902-60280eb4523c"),
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
            image: img("1555126627-2b7d41f715c6"),
            tags: ["Spicy", "Tapas"],
            description: "Patatas fritas con salsa picante.",
          },
          {
            name: "Chorizo a la Sidra",
            price: 9.0,
            image: img("1574484284002-952d924558e0"),
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
            image: img("1506377247377-2a5b3b417ebb"),
            tags: ["Alcohol"],
            description: "Copa de vino tinto.",
          },
          {
            name: "Cerveza",
            price: 3.5,
            image: img("1607559136127-e2a2253303c7"),
            tags: ["Alcohol", "Cold"],
            description: "Caña de cerveza rubia.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Crema Catalana",
            price: 6.0,
            image: img("1618790325946-b8e723223126"),
            tags: ["Sweet"],
            description: "Crema pastelera con azúcar quemado.",
          },
          {
            name: "Churros",
            price: 6.5,
            image: img("1624371414361-e670edf4803d"),
            tags: ["Sweet"],
            description: "Masa frita con chocolate caliente.",
          },
        ];
      }
      return [
        {
          name: "Jamón Ibérico",
          price: 22.0,
          image: img("1559563362-c667ba5f5480"),
          tags: ["Premium"],
          description: "Jamón curado de bellota cortado a mano.",
        },
        {
          name: "Patatas Bravas",
          price: 8.5,
          image: img("1593560708920-61dd98c46a4e"),
          tags: ["Spicy"],
          description: "Patatas fritas con salsa picante.",
        },
        {
          name: "Paella Mixta",
          price: 18.0,
          image: img("1534080564583-6be75777b70a"),
          tags: ["Classic"],
          description: "Arroz con marisco y pollo.",
        },
        {
          name: "Tortilla Española",
          price: 9.0,
          image: img("1619895092538-128341789043"),
          tags: ["Vegetarian"],
          description: "Tortilla de patatas y huevo.",
        },
        {
          name: "Croquetas",
          price: 10.0,
          image: img("1596791243171-d6c1b3337905"),
          tags: ["Tapas"],
          description: "Bechamel cremosa con jamón frita.",
        },
      ];
    } else {
      // Burgers / Fast Food
      if (category === "kids") {
        return [
          {
            name: "Kids Burger",
            price: 7.99,
            image: img("1551782450-a2132b4ba21d"),
            tags: ["Kids"],
            description: "Hamburguesa sencilla con ketchup.",
          },
          {
            name: "Mac & Cheese",
            price: 6.99,
            image: img("1543339308-43e59d6b73a6"),
            tags: ["Cheesy"],
            description: "Macarrones con salsa de queso.",
          },
          {
            name: "Nuggets",
            price: 6.5,
            image: img("1562967963-ed7b199d9b69"),
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
            image: img("1601666687353-06655c65b161"),
            tags: ["Hot"],
            description: "Con chiles jalapeños y salsa picante.",
          },
          {
            name: "Spicy Wings",
            price: 11.99,
            image: img("1608039829572-78524f79c4c7"),
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
            image: img("1622483767028-3f66f32aef97"),
            tags: ["Soda", "Cold"],
            description: "Refresco de cola con hielo.",
          },
          {
            name: "Batido de Fresa",
            price: 4.5,
            image: img("1577805947693-f9d446f0259e"),
            tags: ["Sweet", "Cold"],
            description: "Batido cremoso de fresa.",
          },
        ];
      }
      if (category === "dessert") {
        return [
          {
            name: "Helado Sundae",
            price: 4.5,
            image: img("1563805042-7684c019e1cb"),
            tags: ["Cold"],
            description: "Helado de vainilla con sirope.",
          },
          {
            name: "Brownie",
            price: 5.0,
            image: img("1606313564200-e75d5e30476d"),
            tags: ["Sweet"],
            description: "Bizcocho de chocolate templado.",
          },
        ];
      }
      return [
        {
          name: "Classic Smash",
          price: 12.99,
          image: img("1568901346375-23c9450c58cd"),
          tags: ["Popular"],
          description: "Doble carne con queso fundido.",
        },
        {
          name: "Truffle Burger",
          price: 15.5,
          image: img("1594212699903-ec8a3eca50f5"),
          tags: ["Gourmet", "Best Value"],
          bestValue: true,
          description: "Hamburguesa con mayonesa de trufa.",
        },
        {
          name: "Chicken Wings",
          price: 10.99,
          image: img("1513639776629-7b611594e29b"),
          tags: ["Spicy"],
          description: "Alitas de pollo estilo buffalo.",
        },
        {
          name: "Caesar Salad",
          price: 11.5,
          image: img("1550304943-4f24f54ddde9"),
          tags: ["Healthy"],
          description: "Lechuga romana con parmesano crutones.",
        },
        {
          name: "Fries",
          price: 4.99,
          image: img("1573080496987-a2267f884f4a"),
          tags: ["Side"],
          description: "Patatas fritas doradas y crujientes.",
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

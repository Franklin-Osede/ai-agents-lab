import { Component, inject, signal, OnInit } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { VoiceService } from "../../../shared/services/voice.service";

interface MenuCard {
  name: string;
  price: number; // Changed to number for easier calculation
  image: string;
  tags: string[];
  description: string; // For tooltip
  bestValue?: boolean;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  time: string;
  cards?: MenuCard[];
}

@Component({
  selector: "app-ai-menu-chat",
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: "./ai-menu-chat.component.html",
  styleUrls: ["./ai-menu-chat.component.scss"],
})
export class AiMenuChatComponent implements OnInit {
  private voiceService = inject(VoiceService);
  private router = inject(Router);

  inputText = signal("");
  isRecording = signal(false);
  cart = signal<MenuCard[]>([]);
  cartTotal = signal(0);

  messages = signal<ChatMessage[]>([
    {
      role: "ai",
      text: "Hi! What are you craving today?",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  restaurantName = "Chef Maria";
  cuisineType = "General";
  showOptions = signal(true);
  isAgentSpeaking = signal(false);

  suggestions = signal<string[]>([
    "🥗 Platos Populares",
    "⭐ Recomendaciones del Chef",
    "🌶️ Algo Picante",
    "🧒 Menú Infantil",
  ]);

  ngOnInit() {
    // Retrieve restaurant data passed via Router state
    const state = history.state;
    if (state && state.data) {
      const data = state.data;
      this.restaurantName = data.name; // Keep restaurant name, Agent is Maria
      this.cuisineType = data.type || "General";

      const welcomeText = `¡Bienvenido a ${
        this.restaurantName
      }! Soy Maria. Puedo ayudarte a encontrar los mejores platos de comida ${this.getTypeTranslation(
        this.cuisineType
      )}. ¿Qué te apetece hoy?`;

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

      // Auto-play audio welcome
      setTimeout(() => this.speak(welcomeText), 500);
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
        text: text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    this.inputText.set("");

    // Determine Mock Response based on Cuisine Type
    const type = this.cuisineType.toLowerCase();
    let responseText = "Aquí tienes algunas recomendaciones.";

    // Hide options after first interaction
    this.showOptions.set(false);

    const cards = this.getCardsForCuisine(type);

    if (type.includes("japan") || type.includes("sushi")) {
      responseText =
        "¡Excelente elección! Nuestro sushi es muy fresco hoy. Aquí tienes nuestras opciones más sabrosas.";
    } else if (type.includes("italian") || type.includes("pizza")) {
      responseText = "Aquí tienes nuestras especialidades italianas más ricas.";
    } else {
      responseText = "Entendido. Aquí tienes nuestras mejores opciones.";
    }

    // Mock AI Response
    setTimeout(() => {
      this.messages.update((msgs) => [
        ...msgs,
        {
          role: "ai",
          text: responseText,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          cards: cards,
        },
      ]);
      this.speak(responseText);
    }, 1000);
  }

  handleOption(option: string) {
    this.inputText.set(option);
    this.sendMessage();
  }

  speak(text: string) {
    if ("speechSynthesis" in window) {
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

      utterance.onstart = () => this.isAgentSpeaking.set(true);
      utterance.onend = () => this.isAgentSpeaking.set(false);

      window.speechSynthesis.speak(utterance);
    }
  }

  addToCart(item: MenuCard) {
    this.cart.update((items) => [...items, item]);
    this.cartTotal.update((total) => total + item.price);
  }

  viewDetails(item: MenuCard) {
    // Navigate to details (mock for now, or use a modal)
    console.log("View details for", item.name);
    // Logic to navigate could go here:
    // this.router.navigate(['/rider/dish', item.name]);
  }

  getCardsForCuisine(type: string): MenuCard[] {
    if (type.includes("japan") || type.includes("sushi")) {
      return [
        {
          name: "Salmon Nigiri Set",
          price: 14.5,
          image:
            "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500",
          tags: ["Fresh", "Best Seller"],
          bestValue: true,
          description: "Fresh salmon over seasoned rice.",
        },
        {
          name: "Spicy Tuna Roll",
          price: 11.0,
          image:
            "https://images.unsplash.com/photo-1553621042-f6e147245754?w=500",
          tags: ["Spicy"],
          description: "Tuna with spicy mayo and cucumber.",
        },
        {
          name: "Dragon Roll",
          price: 16.0,
          image:
            "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500",
          tags: ["Chef's Pick"],
          description: "Eel and cucumber topped with avocado.",
        },
        {
          name: "Miso Soup",
          price: 4.5,
          image:
            "https://images.unsplash.com/photo-1547592180-85f173990554?w=500",
          tags: ["Warm"],
          description: "Traditional soybean soup with tofu.",
        },
        {
          name: "Tempura Udon",
          price: 13.5,
          image:
            "https://images.unsplash.com/photo-1552611052-33e04de081de?w=500",
          tags: ["Hot Node"],
          description: "Thick noodles in broth with crispy tempura.",
        },
      ];
    } else if (type.includes("italian") || type.includes("pizza")) {
      return [
        {
          name: "Margherita Pizza",
          price: 13.9,
          image:
            "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
          tags: ["Vegetarian"],
          description: "Tomato, mozzarella, and basil.",
        },
        {
          name: "Carbonara",
          price: 15.5,
          image:
            "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500",
          tags: ["Creamy"],
          description: "Pasta with egg, cheese, and pancetta.",
        },
        {
          name: "Lasagna",
          price: 16.0,
          image:
            "https://images.unsplash.com/photo-1574868291534-18cd5700fa40?w=500",
          tags: ["Hearty"],
          description: "Layered pasta with meat sauce.",
        },
        {
          name: "Tiramisu",
          price: 8.0,
          image:
            "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500",
          tags: ["Dessert"],
          description: "Coffee-flavored Italian dessert.",
        },
        {
          name: "Risotto",
          price: 18.0,
          image:
            "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=500",
          tags: ["Creamy"],
          description: "Arborio rice with mushrooms.",
        },
      ];
    } else {
      return [
        {
          name: "Classic Smash",
          price: 12.99,
          image:
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
          tags: ["Popular"],
          description: "Double beef patty with cheese.",
        },
        {
          name: "Truffle Burger",
          price: 15.5,
          image:
            "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500",
          tags: ["Gourmet", "Best Value"],
          bestValue: true,
          description: "Beef burger with truffle mayo.",
        },
        {
          name: "Chicken Wings",
          price: 10.99,
          image:
            "https://images.unsplash.com/photo-1513639776629-7b611594e29b?w=500",
          tags: ["Spicy"],
          description: "Buffalo wings with ranch.",
        },
        {
          name: "Caesar Salad",
          price: 11.5,
          image:
            "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500",
          tags: ["Healthy"],
          description: "Romaine lettuce with parmesan.",
        },
        {
          name: "Fries",
          price: 4.99,
          image:
            "https://images.unsplash.com/photo-1573080496987-a2267f884f4a?w=500",
          tags: ["Side"],
          description: "Crispy golden french fries.",
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

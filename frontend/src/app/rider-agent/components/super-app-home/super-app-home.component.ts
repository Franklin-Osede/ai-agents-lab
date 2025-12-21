import {
  Component,
  Input,
  Output,
  EventEmitter,
  booleanAttribute,
  signal,
  OnInit,
  OnDestroy,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { VoiceService } from "../../../shared/services/voice.service";

@Component({
  selector: "app-super-app-home",
  templateUrl: "./super-app-home.component.html",
  styleUrls: [], // No separate style file used as Tailwind is used in HTML
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class SuperAppHomeComponent implements OnInit, OnDestroy {
  @Input({ transform: booleanAttribute }) dialog = false;
  @Output() modalClose = new EventEmitter<void>();

  currentTime = signal<string>("9:41");
  isListening = signal(false);
  isProcessing = signal(false);
  isAgentSpeaking = signal(false); // New state for Agent animation
  searchResults = signal<any[]>([]);
  searchQuery = signal("");

  recentReviews = signal([
    {
      id: "2",
      type: "Japanese",
      restaurant: "Sushi Master",
      image:
        "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop",
      user: "Alice",
      rating: 5,
      comment: "Best sushi in town! 🍣",
      time: "2m ago",
    },
    {
      id: "5",
      type: "Fast Food",
      restaurant: "Burger King",
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop",
      user: "John",
      rating: 4,
      comment: "Great deal on the Whopper.",
      time: "15m ago",
    },
    {
      id: "1",
      type: "Italian",
      restaurant: "Bella Pizza",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop",
      user: "Maria",
      rating: 5,
      comment: "Authentic Italian taste!",
      time: "1h ago",
    },
  ]);

  // Cart Logic
  cart = signal<any[]>([]);
  cartTotal = signal(0);

  addToCart(item: any) {
    this.cart.update((items) => [...items, item]);
    this.cartTotal.update((total) => total + (item.price || 12.99));
    // Optional: Visual feedback
  }

  goToCheckout() {
    this.router.navigate(["/rider/checkout"]);
  }

  private timeInterval: any;
  private router = inject(Router);
  private voiceService = inject(VoiceService);
  private http = inject(HttpClient);

  // ... (existing helper methods)

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 60000);

    // Play greeting after a short delay
    setTimeout(() => {
      this.playGreeting();
    }, 1000);
  }

  playGreeting() {
    if ("speechSynthesis" in window) {
      const text = "Hola Alex, bienvenido! ¿Qué te apetece comer hoy?";
      const utterance = new SpeechSynthesisUtterance(text);

      // Try to select a Spanish voice
      const voices = window.speechSynthesis.getVoices();
      // Prefer premium/Google voices if available, falling back to any 'es' voice
      const spanishVoice = voices.find(
        (v) =>
          v.lang.includes("es") &&
          (v.name.includes("Google") ||
            v.name.includes("Monica") ||
            v.name.includes("Paulina"))
      );
      if (spanishVoice) utterance.voice = spanishVoice;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Animation control
      utterance.onstart = () => this.isAgentSpeaking.set(true);
      utterance.onend = () => this.isAgentSpeaking.set(false);

      window.speechSynthesis.speak(utterance);
    }
  }

  async toggleRecording() {
    if (this.isListening()) {
      this.isListening.set(false);
      this.voiceService.stopListening();
    } else {
      this.isListening.set(true);
      this.searchResults.set([]);

      try {
        // Use Browser's Native Speech Recognition (Real STT)
        // This ensures "Chicken" -> "Chicken" text -> Chicken Results
        const transcript = await this.voiceService.listen();

        this.isListening.set(false);
        if (transcript) {
          this.searchQuery.set(transcript);
          // Pass the transcript directly to ensure immediate execution
          this.submitTextQuery(transcript);
        }
      } catch (error) {
        console.error("Error recognizing speech:", error);
        this.isListening.set(false);
      }
    }
  }

  private async processRiderRequest(audioBlob: Blob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    // Explicitly use the controller endpoint
    const apiUrl = "http://localhost:3005/api/v1/agents/rider/interact";

    try {
      const response: any = await this.http.post(apiUrl, formData).toPromise();
      console.log("Backend response:", response);

      // Robust Demo Logic:
      // Use the backend's inferred search term if available, otherwise fallback to "italian"
      // This ensures our rich frontend mock data is always used for display.
      let term = "italian";
      if (response && response.search_term) {
        term = response.search_term;
      }

      // Call the frontend search logic with the term
      await this.submitTextQuery(term);
    } catch (error) {
      console.error("Error interacting with Rider Agent:", error);
      // Fallback for demo purposes if backend is down
      await this.submitTextQuery("italian");
    } finally {
      this.isProcessing.set(false);
    }
  }

  // Handle Text/Voice Submission
  // overrideQuery allows voice logic to reuse this method
  async submitTextQuery(overrideQuery?: string) {
    const rawInput = this.searchQuery().trim();
    if (!rawInput && !overrideQuery) return;

    this.isProcessing.set(true);
    // Use override if provided (voice), else input (text)
    const query = (overrideQuery || rawInput).toLowerCase();

    // Simulate API delay only if text (voice already had network delay)
    if (!overrideQuery) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    let results = [];

    // Extended Mock Logic to cover user scenarios
    // Mock Logic for Courses
    if (query.includes("entrantes")) {
      results = [
        {
          id: "e1",
          name: "Nachos Supreme",
          type: "Starter",
          price: 8.5,
          time: "10-15 min",
          image:
            "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500",
        },
        {
          id: "e2",
          name: "Spring Rolls",
          type: "Starter",
          price: 6.5,
          time: "10-15 min",
          image:
            "https://images.unsplash.com/photo-1544601284-2630b389013a?w=500",
        },
        {
          id: "e3",
          name: "Garlic Bread",
          type: "Starter",
          price: 5.0,
          time: "5-10 min",
          image:
            "https://images.unsplash.com/photo-1573140247632-f84660f67627?w=500",
        },
        {
          id: "e4",
          name: "Caesar Salad",
          type: "Starter",
          price: 9.0,
          time: "10-15 min",
          image:
            "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500",
        },
      ];
    } else if (query.includes("principales") || query.includes("main")) {
      results = [
        {
          id: "m1",
          name: "Truffle Burger",
          type: "Main",
          price: 15.5,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
        },
        {
          id: "m2",
          name: "Spaghetti Carbonara",
          type: "Main",
          price: 14.0,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500",
        },
        {
          id: "m3",
          name: "Grilled Salmon",
          type: "Main",
          price: 18.5,
          time: "25-35 min",
          image:
            "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?w=500",
        },
        {
          id: "m4",
          name: "Steak Frites",
          type: "Main",
          price: 22.0,
          time: "30-40 min",
          image:
            "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500",
        },
      ];
    } else if (query.includes("postres") || query.includes("dessert")) {
      results = [
        {
          id: "d1",
          name: "Chocolate Cake",
          type: "Dessert",
          price: 7.5,
          time: "5-10 min",
          image:
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500",
        },
        {
          id: "d2",
          name: "Cheesecake",
          type: "Dessert",
          price: 8.0,
          time: "5-10 min",
          image:
            "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=500",
        },
        {
          id: "d3",
          name: "Tiramisu",
          type: "Dessert",
          price: 7.0,
          time: "5-10 min",
          image:
            "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500",
        },
      ];
    } else if (query.includes("bebidas") || query.includes("drinks")) {
      results = [
        {
          id: "b1",
          name: "Coca Cola",
          type: "Drink",
          price: 2.5,
          time: "immediate",
          image:
            "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500",
        },
        {
          id: "b2",
          name: "Fresh Orange Juice",
          type: "Drink",
          price: 4.5,
          time: "5 min",
          image:
            "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500",
        },
        {
          id: "b3",
          name: "Craft Beer",
          type: "Drink",
          price: 5.5,
          time: "immediate",
          image:
            "https://images.unsplash.com/photo-1608270586620-25fd98415893?w=500",
        },
      ];
    } else if (
      query.includes("sushi") ||
      query.includes("japanese") ||
      query.includes("asiatico")
    ) {
      results = [
        {
          id: "2",
          name: "Sushi Master",
          type: "Japanese",
          rating: 4.8,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop",
        },
        {
          id: "3",
          name: "Tokyo Roll",
          type: "Japanese",
          rating: 4.5,
          time: "35-45 min",
          image:
            "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&auto=format&fit=crop",
        },
        {
          id: "21",
          name: "Omakase King",
          type: "Japanese",
          rating: 4.9,
          time: "40-50 min",
          image:
            "https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&auto=format&fit=crop",
        },
        {
          id: "22",
          name: "Zen Garden",
          type: "Japanese",
          rating: 4.6,
          time: "30-40 min",
          image:
            "https://images.unsplash.com/photo-1617196034421-24e74917a035?w=500&auto=format&fit=crop",
        },
      ];
    } else if (
      query.includes("pasta") ||
      query.includes("spaghetti") ||
      query.includes("macaroni") ||
      query.includes("fideos")
    ) {
      results = [
        {
          id: "19",
          name: "Tony's Pasta",
          type: "Pasta",
          rating: 4.7,
          time: "25-35 min",
          image:
            "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&auto=format&fit=crop",
        },
        {
          id: "20",
          name: "Pasta House",
          type: "Italian",
          rating: 4.5,
          time: "30-40 min",
          image:
            "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop",
        },
        {
          id: "23",
          name: "Mama Mia",
          type: "Italian",
          rating: 4.3,
          time: "25-35 min",
          image:
            "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&auto=format&fit=crop",
        },
        {
          id: "24",
          name: "Spaghetti & Co",
          type: "Pasta",
          rating: 4.4,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=500&auto=format&fit=crop",
        },
      ];
    } else if (
      query.includes("pizza") ||
      query.includes("italian") ||
      query.includes("italiano")
    ) {
      results = [
        {
          id: "1",
          name: "Bella Pizza",
          type: "Italian",
          rating: 4.2,
          time: "35-45 min",
          image:
            "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop",
        },
        {
          id: "4",
          name: "Luigi's",
          type: "Italian",
          rating: 4.6,
          time: "25-35 min",
          image:
            "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop",
        },
        {
          id: "25",
          name: "Pizza Hut",
          type: "Fast Food",
          rating: 4.0,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop",
        },
        {
          id: "26",
          name: "Papa's Pizzeria",
          type: "Italian",
          rating: 4.1,
          time: "30-40 min",
          image:
            "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=500&auto=format&fit=crop",
        },
      ];
    } else if (query.includes("burger") || query.includes("hamburguesa")) {
      results = [
        {
          id: "5",
          name: "Burger King",
          type: "Fast Food",
          rating: 4.1,
          time: "15-25 min",
          image:
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop",
        },
        {
          id: "6",
          name: "The Good Burger",
          type: "Gourmet",
          rating: 4.7,
          time: "25-35 min",
          image:
            "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop",
        },
        {
          id: "27",
          name: "Smash House",
          type: "Gourmet",
          rating: 4.8,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&auto=format&fit=crop",
        },
        {
          id: "28",
          name: "Classic Diner",
          type: "American",
          rating: 4.3,
          time: "30-40 min",
          image:
            "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop",
        },
      ];
    } else if (
      query.includes("chicken") ||
      query.includes("pollo") ||
      query.includes("pollos")
    ) {
      results = [
        {
          id: "7",
          name: "KFC",
          type: "Fast Food",
          rating: 4.0,
          time: "15-25 min",
          image:
            "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&auto=format&fit=crop",
        },
        {
          id: "8",
          name: "Los Pollos Hermanos",
          type: "Chicken",
          rating: 4.9,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&auto=format&fit=crop",
        },
        {
          id: "29",
          name: "Wing Stop",
          type: "Wings",
          rating: 4.2,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1513639776629-7b611594e29b?w=500&auto=format&fit=crop",
        },
        {
          id: "30",
          name: "Chicken Shack",
          type: "Southern",
          rating: 4.5,
          time: "25-35 min",
          image:
            "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&auto=format&fit=crop",
        },
      ];
    } else if (query.includes("mexican") || query.includes("taco")) {
      results = [
        {
          id: "9",
          name: "Taco Bell",
          type: "Mexican",
          rating: 3.8,
          time: "10-20 min",
          image:
            "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop",
        },
        {
          id: "10",
          name: "La Taqueria",
          type: "Mexican",
          rating: 4.7,
          time: "25-35 min",
          image:
            "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=500&auto=format&fit=crop",
        },
        {
          id: "31",
          name: "Burrito Bros",
          type: "Mexican",
          rating: 4.4,
          time: "15-25 min",
          image:
            "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&auto=format&fit=crop",
        },
        {
          id: "32",
          name: "Nacho Libre",
          type: "Mexican",
          rating: 4.2,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1504185945330-dd4030ac3cfb?w=500&auto=format&fit=crop",
        },
      ];
    } else if (query.includes("healthy") || query.includes("salad")) {
      results = [
        {
          id: "11",
          name: "Green Salad",
          type: "Healthy",
          rating: 4.6,
          time: "15-25 min",
          image:
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop",
        },
        {
          id: "12",
          name: "Fresh & Co",
          type: "Healthy",
          rating: 4.5,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop",
        },
        {
          id: "33",
          name: "Acai Bowl",
          type: "Healthy",
          rating: 4.7,
          time: "10-20 min",
          image:
            "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&auto=format&fit=crop",
        },
        {
          id: "34",
          name: "Smoothie King",
          type: "Healthy",
          rating: 4.4,
          time: "15-25 min",
          image:
            "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&auto=format&fit=crop",
        },
      ];
    } else if (
      query.includes("carne") ||
      query.includes("meat") ||
      query.includes("steak") ||
      query.includes("parrilla") ||
      query.includes("meet") ||
      query.includes("asado")
    ) {
      results = [
        {
          id: "13",
          name: "The Steakhouse",
          type: "Grill",
          rating: 4.8,
          time: "30-40 min",
          image:
            "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&auto=format&fit=crop",
        },
        {
          id: "14",
          name: "Parrilla Argentina",
          type: "Argentinian",
          rating: 4.7,
          time: "40-50 min",
          image:
            "https://images.unsplash.com/photo-1544025162-d76690b67f11?w=500&auto=format&fit=crop",
        },
        {
          id: "35",
          name: "BBQ Ribs",
          type: "BBQ",
          rating: 4.6,
          time: "35-45 min",
          image:
            "https://images.unsplash.com/photo-1558030006-4506719b7342?w=500&auto=format&fit=crop",
        },
        {
          id: "36",
          name: "The Chop House",
          type: "Grill",
          rating: 4.5,
          time: "30-40 min",
          image:
            "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=500&auto=format&fit=crop",
        },
      ];
    } else if (
      query.includes("vegetarian") ||
      query.includes("vegan") ||
      query.includes("vegetariano") ||
      query.includes("verdura") ||
      query.includes("vege")
    ) {
      results = [
        {
          id: "15",
          name: "Vegan Delight",
          type: "Vegetarian",
          rating: 4.6,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop",
        },
        {
          id: "16",
          name: "The Green Bowl",
          type: "Vegan",
          rating: 4.9,
          time: "15-25 min",
          image:
            "https://images.unsplash.com/photo-1511690656952-34342d5c2899?w=500&auto=format&fit=crop",
        },
        {
          id: "37",
          name: "Plant Based",
          type: "Vegan",
          rating: 4.5,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1540420773420-3366772f40ad?w=500&auto=format&fit=crop",
        },
        {
          id: "38",
          name: "Earth Cafe",
          type: "Vegetarian",
          rating: 4.4,
          time: "25-35 min",
          image:
            "https://images.unsplash.com/photo-1511690656952-34342d5c2899?w=500&auto=format&fit=crop",
        },
      ];
    } else if (
      query.includes("spanish") ||
      query.includes("española") ||
      query.includes("tapas")
    ) {
      results = [
        {
          id: "17",
          name: "Tapas Bar",
          type: "Spanish",
          rating: 4.7,
          time: "25-35 min",
          image:
            "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=500&auto=format&fit=crop",
        },
        {
          id: "18",
          name: "La Bodega",
          type: "Spanish",
          rating: 4.5,
          time: "30-40 min",
          image:
            "https://images.unsplash.com/photo-1536622471556-3b608889aa36?w=500&auto=format&fit=crop",
        },
        {
          id: "39",
          name: "Casa de Pepe",
          type: "Spanish",
          rating: 4.3,
          time: "25-35 min",
          image:
            "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=500&auto=format&fit=crop",
        },
        {
          id: "40",
          name: "Sangria & Tapas",
          type: "Spanish",
          rating: 4.6,
          time: "35-45 min",
          image:
            "https://images.unsplash.com/photo-1626804475297-411dbe6612df?w=500&auto=format&fit=crop",
        },
      ];
    } else {
      // Default fallback if unknown query
      results = [
        {
          id: "1",
          name: "Bella Pizza",
          type: "Italian",
          rating: 4.2,
          time: "35-45 min",
          image:
            "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop",
        },
        {
          id: "2",
          name: "Sushi Master",
          type: "Japanese",
          rating: 4.8,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop",
        },
        {
          id: "8",
          name: "Los Pollos Hermanos",
          type: "Chicken",
          rating: 4.9,
          time: "20-30 min",
          image:
            "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&auto=format&fit=crop",
        },
        {
          id: "13",
          name: "The Steakhouse",
          type: "Grill",
          rating: 4.8,
          time: "30-40 min",
          image:
            "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&auto=format&fit=crop",
        },
      ];
    }
    this.searchResults.set(results);
    this.isProcessing.set(false);
    this.searchQuery.set("");
  }

  selectResult(result: any) {
    this.router.navigate(["/rider/restaurant", result.id], {
      state: { data: result },
    });
  }

  // Legacy method mapped to input click/enter if needed, now calling submit
  searchAgent() {
    this.submitTextQuery();
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    this.currentTime.set(`${hours}:${minutes}`);
  }

  onBack(event?: Event) {
    if (this.dialog) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.modalClose.emit();
    }
  }
}

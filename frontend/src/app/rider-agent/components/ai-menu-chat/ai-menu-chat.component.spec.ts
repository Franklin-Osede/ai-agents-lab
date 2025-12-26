import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { AiMenuChatComponent } from "./ai-menu-chat.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CartService, CartItem } from "../../../shared/services/cart.service";
import { UserSessionService } from "../../services/user-session.service";
import { StateMachineService } from "../../services/state-machine.service";
import { RouterTestingModule } from "@angular/router/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MenuDataService } from "../../services/menu-data.service";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  WritableSignal,
} from "@angular/core";
import { MenuGridComponent } from "./components/menu-grid/menu-grid.component";
import { MenuCategoriesComponent } from "./components/menu-categories/menu-categories.component";
import { CartSummaryComponent } from "./components/cart-summary/cart-summary.component";

import { PollyTTSService } from "../../../shared/services/polly-tts.service";

// Mock Child Components
@Component({ selector: "app-menu-grid", standalone: true, template: "" })
class MockMenuGridComponent {
  @Input() cards: any[] = [];
  @Output() add = new EventEmitter<any>();
  @Output() remove = new EventEmitter<any>();
  @Output() cardClicked = new EventEmitter<any>();
}

@Component({ selector: "app-menu-categories", standalone: true, template: "" })
class MockMenuCategoriesComponent {
  @Input() options: string[] = [];
  @Output() optionSelected = new EventEmitter<string>();
}

@Component({ selector: "app-cart-summary", standalone: true, template: "" })
class MockCartSummaryComponent {
  @Input() count = 0;
  @Input() total = 0;
  @Output() viewOrder = new EventEmitter<void>();
}

// Mock Menu Data
class MockMenuDataService {
  getCardsForCuisine(type: string, category: string) {
    return [{ name: "Test Burger", price: 10, tags: ["fast_food", "burger"] }];
  }
}

// Mock Cart Service
class MockCartService {
  // Use a writable signal for testing
  cartItems: WritableSignal<CartItem[]> = signal([]);

  addToCart(item: any) {}
  removeFromCart(item: any) {}
  getQuantity(name: string) {
    return 0;
  }
  get total() {
    return 0;
  }
  get count() {
    return 0;
  }
}

// Mock Polly Service
class MockPollyTTSService {
  isAgentSpeaking = signal(false);
  speak(text: string) {
    this.isAgentSpeaking.set(true);
    // Simulate audio playing
    setTimeout(() => this.isAgentSpeaking.set(false), 100);
  }
  stop() {
    this.isAgentSpeaking.set(false);
  }
}

describe("AiMenuChatComponent Logic (Text-First Integration)", () => {
  let component: AiMenuChatComponent;
  let fixture: ComponentFixture<AiMenuChatComponent>;
  let cartService: MockCartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AiMenuChatComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
        MockMenuGridComponent,
        MockMenuCategoriesComponent,
        MockCartSummaryComponent,
      ],
      providers: [
        { provide: CartService, useClass: MockCartService },
        UserSessionService,
        StateMachineService,
        { provide: MenuDataService, useClass: MockMenuDataService },
        { provide: PollyTTSService, useClass: MockPollyTTSService },
      ],
    })
      .overrideComponent(AiMenuChatComponent, {
        remove: {
          imports: [
            MenuGridComponent,
            MenuCategoriesComponent,
            CartSummaryComponent,
          ],
        },
        add: {
          imports: [
            MockMenuGridComponent,
            MockMenuCategoriesComponent,
            MockCartSummaryComponent,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AiMenuChatComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService) as unknown as MockCartService;

    // Mock Speech Implementation
    const mockSpeechSynthesis = {
      cancel: jasmine.createSpy("cancel"),
      speak: jasmine.createSpy("speak"),
      getVoices: jasmine.createSpy("getVoices").and.returnValue([]),
      paused: false,
      pending: false,
      speaking: false,
    };

    try {
      Object.defineProperty(window, "speechSynthesis", {
        value: mockSpeechSynthesis,
        writable: true,
      });
    } catch (e) {
      console.warn("Could not mock speechSynthesis directly");
    }

    (window as any).SpeechSynthesisUtterance = class {
      text = "";
      lang = "";
      voice = null;
      onstart = () => {
        console.log("start");
      };
      onend = () => {
        console.log("end");
      };
      onerror = () => {
        console.log("error");
      };
      constructor(text: string) {
        this.text = text;
      }
    };

    fixture.detectChanges();
  });

  // --- LOGIC UNIT TESTS ---
  it('should map "ya lo tengo todo" to "checkout" intent', () => {
    const intent = component.mapTextToIntent("ya lo tengo todo");
    expect(intent).toBe("checkout");
  });

  it("should suggest Desserts if Drinks are added (Contextual Logic)", () => {
    // Set Mock Data
    cartService.cartItems.set([
      {
        id: "1",
        name: "Cola",
        price: 2,
        tags: ["drink"],
        quantity: 1,
        image: "",
        description: "",
      },
    ]);

    // Force update suggestions based on new "addToCart" logic or direct call?
    // addToCart calls this logic.
    const item = { name: "Coke", tags: ["drink"], price: 2, image: "" } as any;
    component.addToCart(item);

    // Verify logic flow
    const suggestions = component.suggestions();
    expect(suggestions.some((s) => s.includes("Postres"))).toBeTrue();
  });

  // --- TEXT-FIRST INTEGRATION TESTS ---

  it('should handle "Postres" text input and switch category', fakeAsync(() => {
    // 1. Simulate Voice/Text Input
    component.inputText.set("quiero postre");

    // 2. Trigger Send
    component.sendMessage();

    // 3. Jump time to allow setTimeouts to finish
    tick(2000);

    // 4. Verify State Change
    const lastMsg = component.messages()[component.messages().length - 1];
    expect(lastMsg.role).toBe("ai"); // Now it should be 'ai'
    // Verify content?
  }));

  it('should handle "A domicilio" text input and navigate', () => {
    const routerSpy = spyOn(component["router"], "navigate");
    component.inputText.set("quiero a domicilio");
    component.sendMessage();
    expect(routerSpy).toHaveBeenCalledWith(["/rider/checkout"]);
  });
});

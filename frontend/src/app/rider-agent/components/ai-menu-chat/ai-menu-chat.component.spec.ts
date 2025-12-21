import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AiMenuChatComponent } from "./ai-menu-chat.component";
import { VoiceService } from "../../../shared/services/voice.service";
import { RouterTestingModule } from "@angular/router/testing";

describe("AiMenuChatComponent", () => {
  let component: AiMenuChatComponent;
  let fixture: ComponentFixture<AiMenuChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiMenuChatComponent, RouterTestingModule],
      providers: [
        {
          provide: VoiceService,
          useValue: {
            listen: jasmine
              .createSpy("listen")
              .and.returnValue(Promise.resolve("test")),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiMenuChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize with empty cart", () => {
    expect(component.cart().length).toBe(0);
    expect(component.cartTotal()).toBe(0);
  });

  it("should add item to cart", () => {
    const item = { name: "Test Item", price: 10.0, image: "", tags: [] };
    component.addToCart(item);
    expect(component.cart().length).toBe(1);
    expect(component.cartTotal()).toBe(10.0);
  });

  it("should generate 5 menu items for recommendations", () => {
    // Trigger the logic that generates cards (e.g., via manually calling a generation method or mocking input)
    // For now, we'll verify the data structure logic inside the component if we can access it,
    // or refine the test after seeing the implementation.
    // Let's assume we call a method to get cards.
    const cards = component.getCardsForCuisine("Italian");
    expect(cards.length).toBe(5);
  });
});

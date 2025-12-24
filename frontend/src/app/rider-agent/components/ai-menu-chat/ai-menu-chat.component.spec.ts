import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AiMenuChatComponent } from "./ai-menu-chat.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CartService } from "../../../shared/services/cart.service";
import { UserSessionService } from "../../services/user-session.service";
import { StateMachineService } from "../../services/state-machine.service";
import { RouterTestingModule } from "@angular/router/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("AiMenuChatComponent Logic", () => {
  let component: AiMenuChatComponent;
  let fixture: ComponentFixture<AiMenuChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AiMenuChatComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
      ],
      providers: [CartService, UserSessionService, StateMachineService],
    }).compileComponents();

    fixture = TestBed.createComponent(AiMenuChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should map "ya lo tengo todo" to "confirm_order" intent', () => {
    const intent = component.mapTextToIntent("ya lo tengo todo");
    expect(intent).toBe("confirm_order");
  });

  it('should map "finalizar pedido" to "confirm_order" intent', () => {
    const intent = component.mapTextToIntent("finalizar pedido");
    expect(intent).toBe("confirm_order");
  });

  it("should not suggest items already in cart (Smart Filtering)", () => {
    // Mock Cart with Drinks
    spyOn(component.cartService, "cartItems").and.returnValue([
      { id: "1", name: "Cola", price: 2, tags: ["drink"] } as any,
    ]);

    // Mock Item being added (Burger)
    const item = { name: "Burger", tags: ["burger", "fast_food"] } as any;

    component.addToCart(item);

    const suggestions = component.suggestions();
    // Should NOT contain "🥤 Bebidas"
    expect(suggestions.some((s) => s.includes("Bebidas"))).toBeFalse();
    // Should contain "Postres"? (Burgers usually suggest Drinks, Sides, Chicken. If Drink matches, it removes it).
    // Logic: if tags.includes('burger') -> nextOptions includes 'Bebidas'.
    // Filtering removes it.
  });

  it("should suggest Desserts if Drinks are added (Contextual)", () => {
    // Mock Cart Empty
    spyOn(component.cartService, "cartItems").and.returnValue([]);

    // Add Drink
    const item = { name: "Coke", tags: ["drink"] } as any;
    component.addToCart(item);

    const suggestions = component.suggestions();
    expect(suggestions).toContain("🍰 Postres");
  });
});

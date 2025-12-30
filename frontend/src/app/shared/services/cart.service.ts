import { Injectable, signal, PLATFORM_ID, inject } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

export interface CartItem {
  id?: string;
  name: string;
  price: number;
  image: string;
  quantity?: number;
  description?: string; // Add description to match AI chat
  tags?: string[];
}

@Injectable({
  providedIn: "root",
})
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private readonly CART_STORAGE_KEY = "rider_cart_items";

  cartItems = signal<CartItem[]>([]);

  constructor() {
    // Load cart from localStorage on initialization
    if (isPlatformBrowser(this.platformId)) {
      this.loadCartFromStorage();
    }
  }

  get total() {
    return this.cartItems().reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    );
  }

  get count() {
    return this.cartItems().reduce(
      (count, item) => count + (item.quantity || 1),
      0
    );
  }

  addToCart(item: CartItem) {
    this.cartItems.update((items) => {
      const existing = items.find((i) => i.name === item.name);
      let newItems: CartItem[];
      if (existing) {
        // Increment quantity logic if we tracked it per item,
        // but for now simple array push or update quantity
        // Ideally we should use immutable update for signal
        newItems = items.map((i) =>
          i.name === item.name ? { ...i, quantity: (i.quantity || 1) + 1 } : i
        );
      } else {
        newItems = [...items, { ...item, quantity: 1 }];
      }
      // Save to localStorage
      this.saveCartToStorage(newItems);
      return newItems;
    });
  }

  removeFromCart(item: CartItem) {
    this.cartItems.update((items) => {
      const existing = items.find((i) => i.name === item.name);
      let newItems: CartItem[];
      if (existing && (existing.quantity || 1) > 1) {
        newItems = items.map((i) =>
          i.name === item.name ? { ...i, quantity: (i.quantity || 1) - 1 } : i
        );
      } else {
        newItems = items.filter((i) => i.name !== item.name);
      }
      // Save to localStorage
      this.saveCartToStorage(newItems);
      return newItems;
    });
  }

  getQuantity(itemName: string): number {
    const item = this.cartItems().find((i) => i.name === itemName);
    return item ? item.quantity || 0 : 0;
  }

  clearCart() {
    this.cartItems.set([]);
    this.saveCartToStorage([]);
  }

  /**
   * Save cart to localStorage for persistence
   */
  private saveCartToStorage(items: CartItem[]): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.warn("Failed to save cart to localStorage:", error);
      }
    }
  }

  /**
   * Load cart from localStorage on initialization
   */
  private loadCartFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(this.CART_STORAGE_KEY);
        if (stored) {
          const items = JSON.parse(stored) as CartItem[];
          this.cartItems.set(items);
        }
      } catch (error) {
        console.warn("Failed to load cart from localStorage:", error);
      }
    }
  }
}

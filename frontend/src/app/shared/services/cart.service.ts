import { Injectable, signal } from "@angular/core";

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
  cartItems = signal<CartItem[]>([]);

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
      if (existing) {
        // Increment quantity logic if we tracked it per item,
        // but for now simple array push or update quantity
        // Ideally we should use immutable update for signal
        return items.map((i) =>
          i.name === item.name ? { ...i, quantity: (i.quantity || 1) + 1 } : i
        );
      }
      return [...items, { ...item, quantity: 1 }];
    });
  }

  removeFromCart(item: CartItem) {
    this.cartItems.update((items) => {
      const existing = items.find((i) => i.name === item.name);
      if (existing && (existing.quantity || 1) > 1) {
        return items.map((i) =>
          i.name === item.name ? { ...i, quantity: (i.quantity || 1) - 1 } : i
        );
      }
      return items.filter((i) => i.name !== item.name);
    });
  }

  getQuantity(itemName: string): number {
    const item = this.cartItems().find((i) => i.name === itemName);
    return item ? item.quantity || 0 : 0;
  }

  clearCart() {
    this.cartItems.set([]);
  }
}

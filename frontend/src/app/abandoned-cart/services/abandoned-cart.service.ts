import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import {
  Cart,
  CartMetrics,
  Campaign,
  EmailPreview,
  WhatsAppSendResult,
  RecoveryStrategy,
  CartStatus,
} from "../models/cart.model";

/**
 * Abandoned Cart Service
 *
 * Handles all API calls related to abandoned cart recovery
 * Follows Angular best practices: providedIn root, typed responses
 */
@Injectable({
  providedIn: "root",
})
export class AbandonedCartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${
    environment.apiBaseUrl || "http://localhost:3000/api/v1"
  }/agents/abandoned-cart`;

  /**
   * Get all abandoned carts
   */
  getAbandonedCarts(olderThanMinutes?: number): Observable<Cart[]> {
    // Try API first, fallback to mock data
    return this.http.get<Cart[]>(`${this.baseUrl}/list`).pipe(
      map((carts) => carts.map(this.mapToCart)),
      catchError(() => {
        // Fallback to mock data if API fails
        return of(this.getMockCarts());
      })
    );
  }

  /**
   * Get mock carts for development
   */
  private getMockCarts(): Cart[] {
    // Real product images
    const productImages: Record<string, string> = {
      Auriculares:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop",
      Zapatillas:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=150&fit=crop",
      Bolso:
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=150&h=150&fit=crop",
      Reloj:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&h=150&fit=crop",
      Cámara:
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop",
      Teclado:
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150&h=150&fit=crop",
      Monitor:
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150&h=150&fit=crop",
      "Silla Ergo":
        "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=150&h=150&fit=crop",
    };

    const carts: Cart[] = [
      {
        id: "cart-1",
        customerId: "customer-1",
        customer: {
          id: "customer-1",
          name: "Juan Pérez",
          email: "juan.p@tech.com",
          phoneNumber: "+34612345678",
          company: "Empresa Tech S.A.",
          totalOrders: 12,
          totalSpent: 14000,
          isVip: true,
        },
        items: [
          {
            productId: "prod-1",
            name: "Smart Watch Blanco",
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
            imageUrl:
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&h=150&fit=crop",
          },
        ],
        totalValue: 1240,
        status: CartStatus.ABANDONED,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        lastModifiedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        recoveryAttempts: 0,
        recoveryProbability: 85,
      },
    ];

    // Generate more mock items
    const names = [
      "María Gómez",
      "Carlos Ruiz",
      "Laura Torres",
      "Pedro Sánchez",
      "Ana López",
      "David Díaz",
      "Elena Morales",
      "Pablo Herrera",
    ];
    const products = [
      "Auriculares",
      "Zapatillas",
      "Bolso",
      "Reloj",
      "Cámara",
      "Teclado",
      "Monitor",
      "Silla Ergo",
    ];

    for (let i = 0; i < 18; i++) {
      const isRecovered = i % 3 === 0; // 33% recovered
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomProduct =
        products[Math.floor(Math.random() * products.length)];
      const productPrice = Math.floor(Math.random() * 500) + 50;

      carts.push({
        id: `cart-mock-${i}`,
        customerId: `customer-mock-${i}`,
        customer: {
          id: `customer-mock-${i}`,
          name: randomName,
          email: `${randomName.toLowerCase().replace(" ", ".")}@example.com`,
          totalOrders: Math.floor(Math.random() * 10),
          totalSpent: Math.floor(Math.random() * 5000),
        },
        items: [
          {
            productId: `prod-mock-${i}`,
            name: randomProduct,
            quantity: 1,
            unitPrice: productPrice,
            totalPrice: productPrice,
            imageUrl:
              productImages[randomProduct] ||
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop",
          },
        ],
        totalValue: productPrice,
        status: isRecovered ? CartStatus.RECOVERED : CartStatus.ABANDONED,
        createdAt: new Date(Date.now() - Math.random() * 72 * 60 * 60 * 1000),
        lastModifiedAt: new Date(
          Date.now() - Math.random() * 72 * 60 * 60 * 1000
        ),
        recoveryAttempts: isRecovered ? 1 : 0,
        recoveryProbability: Math.floor(Math.random() * 100),
      });
    }

    return carts.sort(
      (a, b) => b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime()
    );
  }

  /**
   * Get cart by ID
   */
  getCartById(cartId: string): Observable<Cart> {
    // Try API first, fallback to mock data
    return this.http.get<Cart>(`${this.baseUrl}/${cartId}`).pipe(
      map(this.mapToCart),
      catchError(() => {
        // Fallback to mock data
        const mockCarts = this.getMockCarts();
        const cart = mockCarts.find((c) => c.id === cartId) || mockCarts[0];
        return of(cart);
      })
    );
  }

  /**
   * Get dashboard metrics
   */
  getMetrics(): Observable<CartMetrics> {
    // This would call a dedicated metrics endpoint
    // For now, calculate from carts
    return this.getAbandonedCarts().pipe(
      map((carts) => this.calculateMetrics(carts))
    );
  }

  /**
   * Trigger recovery process
   */
  triggerRecovery(
    olderThanMinutes = 60
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/trigger`,
      { olderThanMinutes }
    );
  }

  /**
   * Send WhatsApp message for cart recovery
   */
  sendWhatsApp(
    cartId: string,
    phoneNumber: string,
    message?: string,
    audioUrl?: string
  ): Observable<WhatsAppSendResult> {
    return this.http.post<WhatsAppSendResult>(`${this.baseUrl}/send-whatsapp`, {
      cartId,
      phoneNumber,
      message,
      audioUrl,
    });
  }

  /**
   * Generate email preview
   */
  previewEmail(data: {
    cartId: string;
    customerName: string;
    customerEmail: string;
    cartItems: { name: string; quantity: number; price: number }[];
    cartTotal: number;
    discountCode?: string;
    discountPercent?: number;
    discountAmount?: number;
    expirationHours?: number;
    recoveryLink?: string;
  }): Observable<EmailPreview> {
    return this.http.post<EmailPreview>(`${this.baseUrl}/preview-email`, data);
  }

  /**
   * Get services status
   */
  getServicesStatus(): Observable<{
    whatsapp: { enabled: boolean; note: string };
    email: { enabled: boolean; mode: string; note: string };
  }> {
    return this.http.get<{
      whatsapp: { enabled: boolean; note: string };
      email: { enabled: boolean; mode: string; note: string };
    }>(`${this.baseUrl}/services-status`);
  }

  /**
   * Mark cart as recovered
   */
  markAsRecovered(cartId: string, orderId?: string): Observable<Cart> {
    return this.http
      .post<Cart>(`${this.baseUrl}/${cartId}/recover`, { orderId })
      .pipe(map(this.mapToCart));
  }

  /**
   * Mark cart as lost
   */
  markAsLost(cartId: string): Observable<Cart> {
    return this.http
      .post<Cart>(`${this.baseUrl}/${cartId}/lost`, {})
      .pipe(map(this.mapToCart));
  }

  /**
   * Map API response to Cart model
   */
  private mapToCart = (data: any): Cart => {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      lastModifiedAt: new Date(data.lastModifiedAt),
      items: data.items || [],
    };
  };

  /**
   * Calculate metrics from carts
   */
  private calculateMetrics(carts: Cart[]): CartMetrics {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const abandonedToday = carts.filter(
      (cart) =>
        new Date(cart.lastModifiedAt) >= today && cart.status === "ABANDONED"
    ).length;

    const totalValue = carts
      .filter((cart) => cart.status === "ABANDONED")
      .reduce((sum, cart) => sum + cart.totalValue, 0);

    const recovered = carts.filter(
      (cart) => cart.status === "RECOVERED"
    ).length;
    const total = carts.length;
    const recoveryRate = total > 0 ? (recovered / total) * 100 : 0;

    const recoveredRevenue = carts
      .filter((cart) => cart.status === "RECOVERED")
      .reduce((sum, cart) => sum + cart.totalValue, 0);

    return {
      abandonedToday,
      totalValue,
      recoveryRate: Math.round(recoveryRate * 10) / 10,
      recoveredRevenue,
    };
  }
}

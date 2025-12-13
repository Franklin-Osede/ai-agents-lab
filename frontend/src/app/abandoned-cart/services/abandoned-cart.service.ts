import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Cart,
  CartMetrics,
  Campaign,
  EmailPreview,
  WhatsAppSendResult,
  RecoveryStrategy,
  CartStatus,
} from '../models/cart.model';

/**
 * Abandoned Cart Service
 * 
 * Handles all API calls related to abandoned cart recovery
 * Follows Angular best practices: providedIn root, typed responses
 */
@Injectable({
  providedIn: 'root',
})
export class AbandonedCartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl || 'http://localhost:3000/api/v1'}/agents/abandoned-cart`;

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
      }),
    );
  }

  /**
   * Get mock carts for development
   */
  private getMockCarts(): Cart[] {
    return [
      {
        id: 'cart-1',
        customerId: 'customer-1',
        customer: {
          id: 'customer-1',
          name: 'Juan Pérez',
          email: 'juan.p@tech.com',
          phoneNumber: '+34612345678',
          company: 'Empresa Tech S.A.',
          totalOrders: 12,
          totalSpent: 14000,
          isVip: true,
        },
        items: [
          {
            productId: 'prod-1',
            name: 'Smart Watch Blanco',
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUOb25zwg5CKzyvxKElkK-U6Y1RN0ReVS_0MAIcFkZAQgHz2OU8i2nB8LfcFUfkLBGTZrrzl174eL0Hr1QHdfl14xE8jIIqmTOtjCbuPmtAcV-vQ0m44LzIZYxHXbtTQPtJMJGQDTZ1FRqSZD81Yl0NQcODHfw4UnT7trg1T5por8RfWQmJ1TLmgTKOTzNH_PeweAD5KvYm0c6LXkf1XYLowrOP2Q9RieBipo4No83s8kUO45pYd90EmDE_giEGQEqNhdTjX4NopM',
          },
          {
            productId: 'prod-2',
            name: 'Auriculares Inalámbricos',
            quantity: 1,
            unitPrice: 250,
            totalPrice: 250,
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCKyxUPUfhorEJmMiBVguNO_Ug1_W2vvpyVty-vgbUriRlDA4-eFGFeLLfcsWpAUu-ofK9TVf-k0zDAkqDTkr2B8cEYjoinL5XmtBN5H2Hp7E54CwyM-i6WH4ui-j3PHb2bXn-Q5S_5zikC1pAXyg5aM7naVPjgZg-pZGWrUZXDxf3xIQpQspyfbKi-BIf5npJ7xtBXvjECqQr4XjEk5ZiuOAC8crEntQ5jGukP5ofQRwWB1sHu4vm1Nev0gLlY2a5D3Biqk34zqM',
          },
          {
            productId: 'prod-3',
            name: 'Lente de Cámara',
            quantity: 1,
            unitPrice: 490,
            totalPrice: 490,
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4E7vtj1buiR582vECaOUjlgsn-yXQW3euBGqUXlu4MQJV7ytaUcj-hbSuOtCz9BHaSfO32y5joj1Mpb4-s6G04m50nxPEwVai6ZT3CY2ZgzPvHhP8mSfi1_3NZDqVZolvidFqw3xoxNDvgVSrSK7P10qx9pVDq_XfVmy5sVH52IHHVMv8Bz0V_VhKgTKiHMvTQ3Pnokp1XFw2GbGeRQ4GO3RqIqHcNXfeawkMqA-U5aLwFpdsGKi41L4UKtpxYRxnbin-0jhy9yo',
          },
        ],
        totalValue: 1240,
        status: CartStatus.ABANDONED,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        lastModifiedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        recoveryAttempts: 0,
        recoveryProbability: 85,
      },
      {
        id: 'cart-2',
        customerId: 'customer-2',
        customer: {
          id: 'customer-2',
          name: 'María Gómez',
          email: 'maria.g@global.com',
          phoneNumber: '+34612345679',
          company: 'Consultora Global',
          totalOrders: 5,
          totalSpent: 2500,
          isVip: false,
        },
        items: [
          {
            productId: 'prod-4',
            name: 'Zapatilla Roja',
            quantity: 1,
            unitPrice: 300,
            totalPrice: 300,
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB72Q3pSmd3V6Zuuqr1XZOwYAjJft99HnB-xy79uz72Fv7uOuHGCFU6aJLrI6KN6UHlp7qkpsIBQt4SiBugJbGd2alxM9yLcudF1pLTGx-N_KYgbtU8O-hWQ3ZCkW9b-segcyXS3AYOQIja0fBjjaLK94eilNLvPxy0yhSpZovS2Obc4StECWYSwb22d1-AZh-BKCfH5puS0rWctX1U_-lVbmqgG28HscQGHZGMD46A_6MKuLkOgK_k1-McMPAnSQJTCVHt1Lsnh0g',
          },
          {
            productId: 'prod-5',
            name: 'Bolsa de Café',
            quantity: 1,
            unitPrice: 150.5,
            totalPrice: 150.5,
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2YTcDBy2dr5ZE8mb-gdW9urw81yylAeTTWKyZgcbs3So4OrckMtEt3cpTVH94ehVKWT3KqTE4qWJHE14FLIMqps4Fc0gtdCba-jAuIlypR8-jFzglqyY_2SG626w3GJexgF53bhaVDb4raDjZpMgOgIjnDOepeDr0MaUpXlSDbChZY_M1lvbfowHdzgDQkNoGNqNwOoswoIKv2rXl3ylwDWky3KAn39ggQXUVTR37sDXPT2bVXv31MDdmyKghSs6UqPqgLEFMDQ4',
          },
        ],
        totalValue: 450.5,
        status: CartStatus.ABANDONED,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        lastModifiedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        recoveryAttempts: 0,
        recoveryProbability: 50,
      },
      {
        id: 'cart-3',
        customerId: 'customer-3',
        customer: {
          id: 'customer-3',
          name: 'Carlos Ruiz',
          email: 'carlos@ruiz.com',
          phoneNumber: '+34612345680',
          company: 'Importadora Ruiz',
          totalOrders: 8,
          totalSpent: 5000,
          isVip: false,
        },
        items: [
          {
            productId: 'prod-6',
            name: 'Reloj Minimalista v2',
            quantity: 1,
            unitPrice: 89.99,
            totalPrice: 89.99,
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBS09iIG9VZluIDNjhwi3i0n6SVtkNGshLQ7mtzq77ymeLGLmC8kRia8AoJEokWJnJHtCWFQ1D8p5vnrcAT1SK5bAQJsgq8X7OyOV4o89AAORrkXPN7CGlFI_Pw1eVrhF0CjscyzdOWPJ3-JaxddqSFbnxrAVVmpj90xN3ROdGbMZ4KSL2e71rmp2fGYIl2O1m_i8zjfDSqHQXDQRWOGCFuKISVvE204wIQfHRb90CFcyOV2_SNqVqj8PZbX6CFzv2uwA91H-NGLik',
            sku: 'WM-2023-SL',
          },
        ],
        totalValue: 89.99,
        status: CartStatus.ABANDONED,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastModifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        recoveryAttempts: 0,
        recoveryProbability: 20,
      },
    ];
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
      }),
    );
  }

  /**
   * Get dashboard metrics
   */
  getMetrics(): Observable<CartMetrics> {
    // This would call a dedicated metrics endpoint
    // For now, calculate from carts
    return this.getAbandonedCarts().pipe(
      map((carts) => this.calculateMetrics(carts)),
    );
  }

  /**
   * Trigger recovery process
   */
  triggerRecovery(olderThanMinutes: number = 60): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/trigger`,
      { olderThanMinutes },
    );
  }

  /**
   * Send WhatsApp message for cart recovery
   */
  sendWhatsApp(cartId: string, phoneNumber: string, message?: string, audioUrl?: string): Observable<WhatsAppSendResult> {
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
    cartItems: Array<{ name: string; quantity: number; price: number }>;
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
    return this.http.post<Cart>(`${this.baseUrl}/${cartId}/recover`, { orderId }).pipe(
      map(this.mapToCart),
    );
  }

  /**
   * Mark cart as lost
   */
  markAsLost(cartId: string): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/${cartId}/lost`, {}).pipe(
      map(this.mapToCart),
    );
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
      (cart) => new Date(cart.lastModifiedAt) >= today && cart.status === 'ABANDONED',
    ).length;

    const totalValue = carts
      .filter((cart) => cart.status === 'ABANDONED')
      .reduce((sum, cart) => sum + cart.totalValue, 0);

    const recovered = carts.filter((cart) => cart.status === 'RECOVERED').length;
    const total = carts.length;
    const recoveryRate = total > 0 ? (recovered / total) * 100 : 0;

    const recoveredRevenue = carts
      .filter((cart) => cart.status === 'RECOVERED')
      .reduce((sum, cart) => sum + cart.totalValue, 0);

    return {
      abandonedToday,
      totalValue,
      recoveryRate: Math.round(recoveryRate * 10) / 10,
      recoveredRevenue,
    };
  }
}


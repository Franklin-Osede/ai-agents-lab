import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AbandonedCartService } from './abandoned-cart.service';
import { Cart, CartStatus } from '../models/cart.model';

describe('AbandonedCartService', () => {
  let service: AbandonedCartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AbandonedCartService],
    });
    service = TestBed.inject(AbandonedCartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAbandonedCarts', () => {
    it('should fetch abandoned carts successfully', (done) => {
      const mockCarts: Cart[] = [
        {
          id: 'cart-1',
          customerId: 'customer-1',
          items: [],
          totalValue: 100,
          status: CartStatus.ABANDONED,
          createdAt: new Date(),
          lastModifiedAt: new Date(),
          recoveryAttempts: 0,
        },
      ];

      service.getAbandonedCarts().subscribe({
        next: (carts) => {
          expect(carts).toBeDefined();
          expect(Array.isArray(carts)).toBe(true);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/list`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCarts);
    });

    it('should handle errors gracefully', (done) => {
      service.getAbandonedCarts().subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/list`);
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('getCartById', () => {
    it('should fetch a single cart by ID', (done) => {
      const mockCart: Cart = {
        id: 'cart-1',
        customerId: 'customer-1',
        items: [],
        totalValue: 100,
        status: CartStatus.ABANDONED,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
        recoveryAttempts: 0,
      };

      service.getCartById('cart-1').subscribe({
        next: (cart) => {
          expect(cart).toBeDefined();
          expect(cart.id).toBe('cart-1');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/cart-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCart);
    });
  });

  describe('triggerRecovery', () => {
    it('should trigger recovery process', (done) => {
      const mockResponse = { success: true, message: 'Processed 5 carts' };

      service.triggerRecovery(60).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.message).toContain('Processed');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/trigger`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ olderThanMinutes: 60 });
      req.flush(mockResponse);
    });
  });

  describe('sendWhatsApp', () => {
    it('should send WhatsApp message', (done) => {
      const mockResponse = {
        success: true,
        messageId: 'msg-123',
        isEnabled: true,
      };

      service.sendWhatsApp('cart-1', '+34612345678', 'Test message').subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.messageId).toBe('msg-123');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/send-whatsapp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        cartId: 'cart-1',
        phoneNumber: '+34612345678',
        message: 'Test message',
        audioUrl: undefined,
      });
      req.flush(mockResponse);
    });
  });

  describe('previewEmail', () => {
    it('should generate email preview', (done) => {
      const mockData = {
        cartId: 'cart-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        cartItems: [{ name: 'Product 1', quantity: 1, price: 100 }],
        cartTotal: 100,
      };

      const mockResponse = {
        html: '<html>...</html>',
        text: 'Plain text version',
        subject: 'Complete your purchase',
      };

      service.previewEmail(mockData).subscribe({
        next: (preview) => {
          expect(preview.html).toBeDefined();
          expect(preview.text).toBeDefined();
          expect(preview.subject).toBeDefined();
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/preview-email`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockData);
      req.flush(mockResponse);
    });
  });

  describe('getServicesStatus', () => {
    it('should get services status', (done) => {
      const mockResponse = {
        whatsapp: { enabled: true, note: 'Service enabled' },
        email: { enabled: true, mode: 'preview', note: 'Preview mode' },
      };

      service.getServicesStatus().subscribe({
        next: (status) => {
          expect(status.whatsapp.enabled).toBe(true);
          expect(status.email.mode).toBe('preview');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/services-status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getMetrics', () => {
    it('should calculate metrics from carts', (done) => {
      const mockCarts: Cart[] = [
        {
          id: 'cart-1',
          customerId: 'customer-1',
          items: [],
          totalValue: 100,
          status: CartStatus.ABANDONED,
          createdAt: new Date(),
          lastModifiedAt: new Date(),
          recoveryAttempts: 0,
        },
        {
          id: 'cart-2',
          customerId: 'customer-2',
          items: [],
          totalValue: 200,
          status: CartStatus.RECOVERED,
          createdAt: new Date(),
          lastModifiedAt: new Date(),
          recoveryAttempts: 1,
        },
      ];

      service.getMetrics().subscribe({
        next: (metrics) => {
          expect(metrics).toBeDefined();
          expect(metrics.abandonedToday).toBeGreaterThanOrEqual(0);
          expect(metrics.totalValue).toBeGreaterThanOrEqual(0);
          expect(metrics.recoveryRate).toBeGreaterThanOrEqual(0);
          expect(metrics.recoveredRevenue).toBeGreaterThanOrEqual(0);
          done();
        },
        error: done.fail,
      });

      // First call to getAbandonedCarts
      const req1 = httpMock.expectOne(`${service['baseUrl']}/list`);
      req1.flush(mockCarts);
    });
  });
});


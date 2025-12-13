import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { CartListComponent } from './cart-list.component';
import { AbandonedCartService } from '../../services/abandoned-cart.service';
import { of, throwError } from 'rxjs';
import { Cart, CartStatus } from '../../models/cart.model';

describe('CartListComponent', () => {
  let component: CartListComponent;
  let fixture: ComponentFixture<CartListComponent>;
  let cartService: jasmine.SpyObj<AbandonedCartService>;

  const mockCarts: Cart[] = [
    {
      id: 'cart-1',
      customerId: 'customer-1',
      customer: {
        id: 'customer-1',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phoneNumber: '+34612345678',
      },
      items: [
        {
          productId: 'prod-1',
          name: 'Product 1',
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
        },
      ],
      totalValue: 100,
      status: CartStatus.ABANDONED,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
      recoveryAttempts: 0,
      recoveryProbability: 85,
    },
  ];

  beforeEach(async () => {
    const cartServiceSpy = jasmine.createSpyObj('AbandonedCartService', ['getAbandonedCarts']);

    await TestBed.configureTestingModule({
      imports: [CartListComponent, RouterModule.forRoot([])],
      providers: [{ provide: AbandonedCartService, useValue: cartServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CartListComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(AbandonedCartService) as jasmine.SpyObj<AbandonedCartService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load carts on init', () => {
      cartService.getAbandonedCarts.and.returnValue(of(mockCarts));

      component.ngOnInit();

      expect(cartService.getAbandonedCarts).toHaveBeenCalled();
      expect(component.carts().length).toBeGreaterThan(0);
      expect(component.loading()).toBe(false);
    });

    it('should handle error and use mock data', () => {
      cartService.getAbandonedCarts.and.returnValue(throwError(() => new Error('Error')));

      component.ngOnInit();

      expect(component.carts().length).toBeGreaterThan(0);
      expect(component.loading()).toBe(false);
    });
  });

  describe('toggleSelection', () => {
    it('should add cart to selection', () => {
      const cartId = 'cart-1';
      component.selectedCarts.set(new Set());

      component.toggleSelection(cartId);

      expect(component.selectedCarts().has(cartId)).toBe(true);
    });

    it('should remove cart from selection if already selected', () => {
      const cartId = 'cart-1';
      component.selectedCarts.set(new Set([cartId]));

      component.toggleSelection(cartId);

      expect(component.selectedCarts().has(cartId)).toBe(false);
    });
  });

  describe('recoverCart', () => {
    it('should call recover cart method', () => {
      spyOn(console, 'log');
      const cartId = 'cart-1';

      component.recoverCart(cartId);

      expect(console.log).toHaveBeenCalledWith('Recovering cart:', cartId);
    });
  });

  describe('getTimeAgo', () => {
    it('should return correct time ago for hours', () => {
      const date = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago
      const result = component.getTimeAgo(date);
      expect(result).toContain('hora');
    });

    it('should return correct time ago for days', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const result = component.getTimeAgo(date);
      expect(result).toContain('día');
    });

    it('should return "Hace poco" for recent dates', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const result = component.getTimeAgo(date);
      expect(result).toBe('Hace poco');
    });
  });

  describe('getProbabilityClass', () => {
    it('should return "high" for probability >= 70', () => {
      expect(component.getProbabilityClass(85)).toBe('high');
      expect(component.getProbabilityClass(70)).toBe('high');
    });

    it('should return "medium" for probability between 40 and 69', () => {
      expect(component.getProbabilityClass(50)).toBe('medium');
      expect(component.getProbabilityClass(40)).toBe('medium');
    });

    it('should return "low" for probability < 40', () => {
      expect(component.getProbabilityClass(20)).toBe('low');
      expect(component.getProbabilityClass(39)).toBe('low');
    });
  });
});


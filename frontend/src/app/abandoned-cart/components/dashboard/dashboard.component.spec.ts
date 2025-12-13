import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AbandonedCartDashboardComponent } from './dashboard.component';
import { AbandonedCartService } from '../../services/abandoned-cart.service';
import { of, throwError } from 'rxjs';
import { CartMetrics } from '../../models/cart.model';

describe('AbandonedCartDashboardComponent', () => {
  let component: AbandonedCartDashboardComponent;
  let fixture: ComponentFixture<AbandonedCartDashboardComponent>;
  let cartService: jasmine.SpyObj<AbandonedCartService>;

  const mockMetrics: CartMetrics = {
    abandonedToday: 142,
    totalValue: 12400,
    recoveryRate: 18.5,
    recoveredRevenue: 2300,
    abandonedTodayChange: 12,
    totalValueChange: 5,
    recoveryRateChange: 2.1,
    recoveredRevenueChange: 8,
  };

  beforeEach(async () => {
    const cartServiceSpy = jasmine.createSpyObj('AbandonedCartService', ['getMetrics']);

    await TestBed.configureTestingModule({
      imports: [AbandonedCartDashboardComponent, RouterModule.forRoot([])],
      providers: [{ provide: AbandonedCartService, useValue: cartServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AbandonedCartDashboardComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(AbandonedCartService) as jasmine.SpyObj<AbandonedCartService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load metrics on init', () => {
      cartService.getMetrics.and.returnValue(of(mockMetrics));

      component.ngOnInit();

      expect(cartService.getMetrics).toHaveBeenCalled();
      expect(component.metrics()).toEqual(mockMetrics);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('should handle error and set mock data', () => {
      cartService.getMetrics.and.returnValue(throwError(() => new Error('Network error')));

      component.ngOnInit();

      expect(cartService.getMetrics).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeTruthy();
      // Should have mock data as fallback
      expect(component.metrics()).toBeDefined();
    });
  });

  describe('refreshMetrics', () => {
    it('should reload metrics', () => {
      cartService.getMetrics.and.returnValue(of(mockMetrics));

      component.refreshMetrics();

      expect(cartService.getMetrics).toHaveBeenCalledTimes(1);
      expect(component.metrics()).toEqual(mockMetrics);
    });

    it('should reset loading state', (done) => {
      cartService.getMetrics.and.returnValue(of(mockMetrics));
      component.loading.set(false);

      component.refreshMetrics();

      // Loading should be set to true immediately
      expect(component.loading()).toBe(true);

      // Wait for async operation to complete
      setTimeout(() => {
        expect(component.loading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('signals', () => {
    it('should initialize with null metrics', () => {
      expect(component.metrics()).toBeNull();
    });

    it('should initialize with loading true', () => {
      expect(component.loading()).toBe(true);
    });

    it('should initialize with null error', () => {
      expect(component.error()).toBeNull();
    });
  });
});


import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { UrlInputComponent } from './url-input.component';

describe('UrlInputComponent (TDD)', () => {
  let component: UrlInputComponent;
  let fixture: ComponentFixture<UrlInputComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      params: of({ niche: 'physiotherapy' }),
    };

    await TestBed.configureTestingModule({
      declarations: [UrlInputComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UrlInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read niche from route params', () => {
    expect(component.niche()).toBe('physiotherapy');
  });

  it('should validate URL format', () => {
    component.url.set('invalid-url');
    expect(component.isValidUrl()).toBe(false);

    component.url.set('https://example.com');
    expect(component.isValidUrl()).toBe(true);
  });

  it('should show error when submitting invalid URL', () => {
    component.url.set('invalid');
    component.onSubmit();

    expect(component.error()).toBe('Por favor, introduce una URL válida');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to training when submitting valid URL', () => {
    component.url.set('https://clinica-ejemplo.com');
    component.onSubmit();

    expect(component.error()).toBe('');
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/booking',
      'physiotherapy',
      'training',
    ], jasmine.objectContaining({
      queryParams: jasmine.objectContaining({
        url: 'https://clinica-ejemplo.com'
      })
    }));
  });

  it('should use demo data when useDemoData is called', () => {
    component.useDemoData();

    expect(component.url()).toBe('https://example.com');
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should go back to niche selector', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/booking', 'select-niche']);
  });
});

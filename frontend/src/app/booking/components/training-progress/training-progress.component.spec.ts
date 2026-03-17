import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TrainingProgressComponent } from './training-progress.component';

describe('TrainingProgressComponent (TDD)', () => {
  let component: TrainingProgressComponent;
  let fixture: ComponentFixture<TrainingProgressComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      params: of({ niche: 'physiotherapy' }),
      queryParams: of({ url: 'https://example.com' }),
    };

    await TestBed.configureTestingModule({
      declarations: [TrainingProgressComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingProgressComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read niche and url from route', () => {
    fixture.detectChanges();
    expect(component.niche()).toBe('physiotherapy');
    expect(component.url()).toBe('https://example.com');
  });

  it('should start with 0% progress', () => {
    expect(component.progress()).toBe(0);
  });

  it('should have initial training steps', () => {
    expect(component.steps().length).toBe(4);
    expect(component.steps()[0].status).toBe('pending');
  });

  it('should simulate progress over time', fakeAsync(() => {
    component.ngOnInit();
    fixture.detectChanges();

    // After 1 second, progress should increase
    tick(1000);
    expect(component.progress()).toBeGreaterThan(0);

    // After 8 seconds, should be complete
    tick(7000);
    expect(component.progress()).toBe(100);
    expect(mockRouter.navigate).toHaveBeenCalled();
  }));

  it('should update step status as progress increases', fakeAsync(() => {
    component.ngOnInit();
    tick(2000);

    const completedSteps = component.steps().filter(s => s.status === 'completed');
    expect(completedSteps.length).toBeGreaterThan(0);
  }));

  it('should add log messages during progress', fakeAsync(() => {
    component.ngOnInit();
    tick(1000);

    expect(component.logs().length).toBeGreaterThan(0);
  }));

  it('should navigate to preview when complete', fakeAsync(() => {
    component.ngOnInit();
    tick(8000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/booking', 'physiotherapy', 'preview'],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          url: 'https://example.com',
        }),
      })
    );
  }));

  it('should cleanup interval on destroy', () => {
    component.ngOnInit();
    spyOn(window, 'clearInterval');
    
    component.ngOnDestroy();
    
    expect(window.clearInterval).toHaveBeenCalled();
  });
});

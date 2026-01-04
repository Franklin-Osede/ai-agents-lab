import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NicheSelectorComponent } from './niche-selector.component';

describe('NicheSelectorComponent', () => {
  let component: NicheSelectorComponent;
  let fixture: ComponentFixture<NicheSelectorComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [NicheSelectorComponent],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(NicheSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 4 categories', () => {
    expect(component.categories.length).toBe(4);
  });

  it('should navigate to physiotherapy setup when selecting health category', () => {
    const healthCategory = component.categories[0];
    component.selectCategory(healthCategory);

    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/booking',
      'physiotherapy',
      'setup',
    ]);
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should update search query signal', () => {
    component.searchQuery.set('fisio');
    expect(component.searchQuery()).toBe('fisio');
  });
});

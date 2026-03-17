import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingOverlayComponent } from './training-overlay.component';

describe('TrainingOverlayComponent', () => {
  let component: TrainingOverlayComponent;
  let fixture: ComponentFixture<TrainingOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingOverlayComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrainingOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

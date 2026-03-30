import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HairTransplantLandingComponent } from './hair-transplant-landing.component';

describe('HairTransplantLandingComponent', () => {
  let component: HairTransplantLandingComponent;
  let fixture: ComponentFixture<HairTransplantLandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HairTransplantLandingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HairTransplantLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

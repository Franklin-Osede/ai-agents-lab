import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupAgentComponent } from './setup-agent.component';

describe('SetupAgentComponent', () => {
  let component: SetupAgentComponent;
  let fixture: ComponentFixture<SetupAgentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupAgentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SetupAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

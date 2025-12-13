import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampaignEditorComponent } from './campaign-editor.component';
import { AbandonedCartService } from '../../services/abandoned-cart.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('CampaignEditorComponent', () => {
  let component: CampaignEditorComponent;
  let fixture: ComponentFixture<CampaignEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, CampaignEditorComponent],
      providers: [AbandonedCartService]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CampaignEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize at Step 1', () => {
    expect(component.currentStep()).toBe(1);
  });

  it('should advance to next step', () => {
    component.currentStep.set(1);
    component.nextStep();
    expect(component.currentStep()).toBe(2);
  });

  it('should go back to previous step', () => {
    component.currentStep.set(2);
    component.prevStep();
    expect(component.currentStep()).toBe(1);
  });

  it('should open Lead Gen Modal when simulating campaign', () => {
    expect(component.showLeadGenModal()).toBeFalse();
    component.simulateCampaign();
    expect(component.showLeadGenModal()).toBeTrue();
  });

  it('should close Lead Gen Modal', () => {
    component.simulateCampaign();
    expect(component.showLeadGenModal()).toBeTrue();
    component.closeLeadGenModal();
    expect(component.showLeadGenModal()).toBeFalse();
  });

  it('should submit lead gen form and close modal', () => {
    component.simulateCampaign();
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    spyOn(window, 'alert'); // Suppress alert

    component.submitLeadGen(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.showLeadGenModal()).toBeFalse();
  });
});

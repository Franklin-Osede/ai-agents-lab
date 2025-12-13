import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';
import { AbandonedCartService } from '../../services/abandoned-cart.service';

@Component({
  selector: 'app-campaign-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, NgClass],
  templateUrl: './campaign-editor.component.html',
  styleUrl: './campaign-editor.component.scss',
})
export class CampaignEditorComponent {
  private readonly cartService = inject(AbandonedCartService);

  currentStep = signal<number>(3);
  offerType = signal<'percentage' | 'fixed' | 'free-shipping'>('percentage');
  discountValue = signal<number>(15);
  expirationHours = signal<number>(48);

  setOfferType(type: 'percentage' | 'fixed' | 'free-shipping'): void {
    this.offerType.set(type);
  }

  setExpiration(hours: number): void {
    this.expirationHours.set(hours);
  }

  saveCampaign(): void {
    // Implementation for saving campaign
    console.log('Saving campaign...');
  }

  goBack(): void {
    window.history.back();
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  nextStep(): void {
    if (this.currentStep() < 5) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }
}


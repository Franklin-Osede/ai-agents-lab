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

  currentStep = signal<number>(1);
  offerType = signal<'percentage' | 'fixed' | 'free-shipping'>('percentage');
  showLeadGenModal = signal<boolean>(false);

  simulateCampaign(): void {
    // Instead of just an alert, we can show the lead gen modal as the "end of demo" hook
    this.showLeadGenModal.set(true);
  }

  closeLeadGenModal(): void {
    this.showLeadGenModal.set(false);
  }

  submitLeadGen(event: Event): void {
    event.preventDefault();
    this.showLeadGenModal.set(false);
    alert('¡Gracias! Tus datos han sido guardados. Pronto te contactaremos.');
  }
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


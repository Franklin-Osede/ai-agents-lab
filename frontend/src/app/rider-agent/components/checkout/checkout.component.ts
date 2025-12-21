import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-checkout",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./checkout.component.html",
  styles: [],
})
export class CheckoutComponent {
  isProcessing = false;
  isSuccess = false;

  processPayment() {
    this.isProcessing = true;
    setTimeout(() => {
      this.isProcessing = false;
      this.isSuccess = true;
    }, 2000);
  }
}

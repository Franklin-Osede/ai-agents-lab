import { Component, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { UserSessionService } from "../../services/user-session.service";
import { CartService } from "../../../shared/services/cart.service";

interface TimeSlot {
  time: string;
  available: boolean;
}

@Component({
  selector: "app-reservations",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./reservations.component.html",
  styleUrls: ["./reservations.component.css"], // Note: using CSS file, but we might want SCSS later.
})
export class ReservationsComponent implements OnInit {
  private router = inject(Router);
  public session = inject(UserSessionService);
  private cartService = inject(CartService);

  todayDate = new Date().toISOString().split("T")[0];
  pax = signal(2);
  selectedSlot = signal<string | null>(null);
  slots = signal<TimeSlot[]>([]);
  cartItems = this.cartService.cartItems;

  ngOnInit() {
    this.generateSlots();
  }

  generateSlots() {
    // Generate slots from 13:00 to 22:00
    const newSlots: TimeSlot[] = [];
    const startHour = 13;
    const endHour = 22;

    for (let h = startHour; h <= endHour; h++) {
      // Slot :00
      newSlots.push({
        time: `${h}:00`,
        available: Math.random() > 0.3, // 70% chance available
      });
      // Slot :30
      newSlots.push({
        time: `${h}:30`,
        available: Math.random() > 0.3,
      });
    }
    this.slots.set(newSlots);
  }

  onDateChange(event: any) {
    // Regenerate slots to simulate fetching availability for that day
    this.selectedSlot.set(null);
    this.generateSlots();
  }

  updatePax(delta: number) {
    this.pax.update((v) => Math.max(1, v + delta));
  }

  selectSlot(slot: TimeSlot) {
    if (slot.available) {
      this.selectedSlot.set(slot.time);
    }
  }

  confirmReservation() {
    if (!this.selectedSlot()) return;

    // Simulate API call/Success
    alert(
      `¡Reserva Confirmada!\nMesa para ${this.pax()} personas a las ${this.selectedSlot()}\n${
        this.cartItems().length > 0 ? "Con pre-pedido activo." : ""
      }`
    );

    // Clear cart or navigate home
    this.router.navigate(["/rider/home"]);
  }

  goBack() {
    this.router.navigate(["/rider/chat"]);
  }
}

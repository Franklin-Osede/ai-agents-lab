import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
  AfterViewInit,
} from "@angular/core";
import { CommonModule, Location, isPlatformBrowser } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CartService } from "../../../shared/services/cart.service";
import { UserSessionService } from "../../services/user-session.service";
import { MapService } from "../../../shared/services/map.service";
import { Subject, debounceTime, distinctUntilChanged, switchMap } from "rxjs"; // RxJS for optimized search
import * as L from "leaflet";

@Component({
  selector: "app-checkout",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./checkout.component.html",
  styles: [
    `
      .map-base {
        filter: grayscale(100%) contrast(1.05) brightness(1.05);
      }
    `,
  ],
})
export class CheckoutComponent implements AfterViewInit {
  cartService = inject(CartService);
  session = inject(UserSessionService);
  mapService = inject(MapService);
  router = inject(Router);
  location = inject(Location);
  platformId = inject(PLATFORM_ID);

  @ViewChild("previewMapContainer") previewMapContainer!: ElementRef;
  private previewMap: L.Map | undefined;
  private previewMarker: L.Marker | undefined;

  isProcessing = false;
  isSuccess = false;

  // Real Cart Data
  cartItems = this.cartService.cartItems;

  // Address Logic
  address = "123 Market St, San Francisco, CA"; // Default fallback
  selectedCoordinates: [number, number] | null = [40.4168, -3.7038];

  isEditingAddress = false;
  addressQuery = "";
  addressResults: any[] = [];
  isSearchingAddress = false;

  private searchSubject = new Subject<string>();

  constructor() {
    // Setup debounced search to avoid spamming the API
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.length < 3) return [];
          this.isSearchingAddress = true;
          return this.mapService.searchAddress(query);
        })
      )
      .subscribe({
        next: (results) => {
          this.addressResults = results;
          this.isSearchingAddress = false;
        },
        error: () => {
          this.isSearchingAddress = false;
          this.addressResults = [];
        },
      });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && !this.isSuccess) {
      this.initPreviewMap();
    }
  }

  initPreviewMap() {
    if (!this.previewMapContainer) return;

    // Create mini static map
    this.previewMap = L.map(this.previewMapContainer.nativeElement, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
    }).setView(this.selectedCoordinates || [40.4168, -3.7038], 15);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      }
    ).addTo(this.previewMap);

    this.updateMapMarker();
  }

  updateMapMarker() {
    if (!this.previewMap || !this.selectedCoordinates) return;

    if (this.previewMarker) this.previewMap.removeLayer(this.previewMarker);

    const icon = L.divIcon({
      html: '<div style="background-color: #0f172a; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4);"></div>',
      className: "",
      iconSize: [18, 18],
    });

    this.previewMarker = L.marker(this.selectedCoordinates, { icon }).addTo(
      this.previewMap
    );
    this.previewMap.setView(this.selectedCoordinates, 15);
  }

  // Aliases for template compatibility
  cart = this.cartService.cartItems;

  totalPrice = () => {
    return this.cartService.total + 2.5; // Subtotal + Delivery Fee
  };

  placeOrder() {
    this.processPayment();
  }

  // Legacy Getters (optional, keep if needed by other parts)
  get subtotal() {
    return this.cartService.total;
  }

  readonly deliveryFee = 2.5;

  get total() {
    return this.subtotal + this.deliveryFee;
  }

  updateMapPreview() {
    if (!this.previewMap || !this.selectedCoordinates) return;

    if (this.previewMarker) this.previewMap.removeLayer(this.previewMarker);

    const icon = L.divIcon({
      html: '<div style="background-color: #0f172a; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4);"></div>',
      className: "",
      iconSize: [18, 18],
    });

    this.previewMarker = L.marker(this.selectedCoordinates, { icon }).addTo(
      this.previewMap
    );
    this.previewMap.setView(this.selectedCoordinates, 15);
  }

  toggleEditAddress() {
    this.isEditingAddress = !this.isEditingAddress;
    if (this.isEditingAddress) {
      // Focus logic could go here if using ViewChild
      this.addressQuery = "";
      this.addressResults = [];
    }
  }

  onAddressInput(query: string) {
    this.searchSubject.next(query);
  }

  selectAddress(result: any) {
    // Nominatim returns lat/lon as strings
    this.selectedCoordinates = [parseFloat(result.lat), parseFloat(result.lon)];

    // Parse Display Name to be shorter (First two parts usually: Street + City/District)
    const parts = result.display_name.split(",");
    if (parts.length >= 2) {
      this.address = `${parts[0].trim()}, ${parts[1].trim()}`;
    } else {
      this.address = result.display_name;
    }

    this.isEditingAddress = false;
    this.addressQuery = "";
    this.addressResults = [];

    // Update the mini-map
    this.updateMapPreview();
  }

  goBack() {
    this.router.navigate(["/rider/chat"]);
  }

  processPayment() {
    this.isProcessing = true;

    // Simulate API call and pass coordinates to the next step (e.g., via Service or URL)
    // For now we just mock the success
    setTimeout(() => {
      this.isProcessing = false;
      this.isSuccess = true;
      this.cartService.clearCart();

      // In a real app, we'd pass the coordinates to the tracking page
      // e.g. this.router.navigate(['/rider/tracking', { lat: ..., lon: ... }]);
    }, 2500);
  }
}

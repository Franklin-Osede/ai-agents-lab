import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { MapService } from "../../../shared/services/map.service";
import * as L from "leaflet";

@Component({
  selector: "app-order-tracking",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./order-tracking.component.html",
  styleUrls: ["./order-tracking.component.css"],
})
export class OrderTrackingComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private mapService = inject(MapService);
  private platformId = inject(PLATFORM_ID);

  // Element Ref for the map div
  @ViewChild("mapContainer") mapContainer!: ElementRef;

  private map: L.Map | undefined;
  private riderMarker: L.Marker | undefined;
  private routePath: [number, number][] = [];

  // Simulation State
  private simulationStartTime = 0;
  private totalDuration = 24; // Fast demo (24s)
  private animationFrameId: any;
  isDelivered = false;
  showLeadGenModal = false;

  // Demo locations (Madrid)
  private restaurantLoc: [number, number] = [40.4168, -3.7038]; // Sol
  private userLoc: [number, number] = [40.4243, -3.6917]; // Cibeles/Retiro area

  ngOnInit() {
    // Only run map logic in browser
    if (isPlatformBrowser(this.platformId)) {
      // Leaflet requires window, execute after view init usually,
      // but in Angular 17+ `afterNextRender` is better.
      // For simplicity in this older style class, we'll try ngAfterViewInit logic or just wait a tick.
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initMap();
        this.startSimulation();
      }, 500);
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    if (!this.mapContainer) return;

    // 1. Initialize Map
    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false, // We want a clean app look
      attributionControl: false,
    }).setView(this.restaurantLoc, 15);

    // 2. Add Tiles (CartoDB Voyager is great for apps, clean look)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      }
    ).addTo(this.map);

    // 3. Add Custom Icons
    const restaurantIcon = L.divIcon({
      html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      className: "",
      iconSize: [20, 20],
    });

    const userIcon = L.divIcon({
      html: '<div style="background-color: #000; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      className: "",
      iconSize: [20, 20],
    });

    // 4. Place Static Markers
    L.marker(this.restaurantLoc, { icon: restaurantIcon }).addTo(this.map);
    L.marker(this.userLoc, { icon: userIcon }).addTo(this.map);

    // 5. Create Rider Marker (We'll move this one)
    const riderIcon = L.divIcon({
      html: `
        <div style="
          background-color: #10b981; 
          width: 38px; 
          height: 38px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white; 
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          border: 3px solid white;
        ">
          <span class="material-symbols-outlined" style="font-size: 20px;">two_wheeler</span>
        </div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20], // Center it
    });

    this.riderMarker = L.marker(this.restaurantLoc, {
      icon: riderIcon,
      zIndexOffset: 1000,
    }).addTo(this.map);
  }

  private startSimulation() {
    this.mapService
      .getRoute(this.restaurantLoc, this.userLoc)
      .subscribe((route) => {
        if (!route || !this.map) return;

        this.routePath = route.coordinates;
        this.routePath = route.coordinates;
        this.totalDuration = 24; // Speed up demo to 24 seconds
        this.simulationStartTime = Date.now();

        // Draw the path line
        L.polyline(this.routePath, {
          color: "#3b82f6",
          weight: 5,
          opacity: 0.6,
          lineCap: "round",
        }).addTo(this.map);

        // Fit bounds to see whole trip
        this.map.fitBounds(L.polyline(this.routePath).getBounds(), {
          padding: [50, 50],
        });

        // Begin Animation Loop
        this.animate();
      });
  }

  private animate() {
    if (!this.map || !this.riderMarker || this.routePath.length === 0) return;

    const now = Date.now();
    const elapsedSeconds = (now - this.simulationStartTime) / 1000;

    // Get new position
    const newPos = this.mapService.interpolatePosition(
      this.routePath,
      this.totalDuration,
      elapsedSeconds
    );

    // Update Marker
    this.riderMarker.setLatLng(newPos);

    // Optional: Pan camera to follow rider if zoom is high
    // this.map.panTo(newPos, { animate: true, duration: 0.1 });

    if (elapsedSeconds < this.totalDuration) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    } else {
      // Arrived!
      this.isDelivered = true;
      this.showLeadGenModal = true;
      if (this.riderMarker) {
        this.riderMarker.setLatLng(this.routePath[this.routePath.length - 1]);
      }
    }
  }

  onCallRider() {
    alert("Llamando a Michael... (Simulación)");
  }

  onMessageRider() {
    alert("Mensaje enviado: '¿Dónde estás?' (Simulación)");
  }

  closeModal() {
    this.showLeadGenModal = false;
  }

  submitLead(email: string) {
    alert(`Gracias! Enviaremos la guía a ${email}`);
    this.closeModal();
  }
}

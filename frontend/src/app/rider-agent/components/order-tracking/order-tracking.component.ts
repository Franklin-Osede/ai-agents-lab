import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Router } from "@angular/router";
import { MapService } from "../../../shared/services/map.service";
import * as L from "leaflet";

@Component({
  selector: "app-order-tracking",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./order-tracking.component.html",
  styleUrls: ["./order-tracking.component.scss"],
})
export class OrderTrackingComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private mapService = inject(MapService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

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

  // Dynamic countdown signals
  countdownMinutes = signal(0);
  countdownSeconds = signal(24);
  estimatedArrival = signal("");
  statusMessage = signal("Llegando pronto");

  // Demo locations (Madrid)
  private restaurantLoc: [number, number] = [40.4168, -3.7038]; // Sol
  private userLoc: [number, number] = [40.4243, -3.6917]; // Cibeles/Retiro area

  ngOnInit() {
    // Calculate estimated arrival time (current time + 24 seconds)
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + 24000);
    this.estimatedArrival.set(
      arrivalTime.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
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
    const remainingSeconds = Math.max(0, this.totalDuration - elapsedSeconds);

    // Update countdown
    const mins = Math.floor(remainingSeconds / 60);
    const secs = Math.floor(remainingSeconds % 60);
    this.countdownMinutes.set(mins);
    this.countdownSeconds.set(secs);

    // Update status message based on remaining time
    if (remainingSeconds > 15) {
      this.statusMessage.set("En camino");
    } else if (remainingSeconds > 5) {
      this.statusMessage.set("Llegando pronto");
    } else if (remainingSeconds > 0) {
      this.statusMessage.set("¡Casi aquí!");
    } else {
      this.statusMessage.set("Entregado");
    }

    // Get new position
    const newPos = this.mapService.interpolatePosition(
      this.routePath,
      this.totalDuration,
      elapsedSeconds
    );

    // Update Marker
    this.riderMarker.setLatLng(newPos);

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

  goBack() {
    window.history.back();
  }

  onCallRider() {
    alert("Llamando a Michael... (Simulación)");
  }

  onMessageRider() {
    alert("Mensaje enviado: '¿Dónde estás?' (Simulación)");
  }

  closeModal() {
    this.showLeadGenModal = false;
    // Redirect to main home page
    this.router.navigate(["/"]);
  }

  submitLead(email: string) {
    alert(`Gracias! Enviaremos la guía a ${email}`);
    this.closeModal();
  }
}

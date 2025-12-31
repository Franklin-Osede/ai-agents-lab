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
import { Router, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { MapService } from "../../../shared/services/map.service";
import { PollyTTSService } from "../../../shared/services/polly-tts.service";
import { UserSessionService } from "../../services/user-session.service";
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
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private polly = inject(PollyTTSService);
  private session = inject(UserSessionService);

  // Dynamic Rider Profile
  riderName = signal("Michael B.");
  riderProfile = signal<any>(null);

  // Element Ref for the map div
  @ViewChild("mapContainer") mapContainer!: ElementRef;

  private map: L.Map | undefined;
  private riderMarker: L.Marker | undefined;
  private routePath: [number, number][] = [];

  // Simulation State
  private simulationStartTime = 0;
  private totalDuration = 10; // Always 10 seconds regardless of distance
  private animationFrameId: any;
  isDelivered = false;
  showLeadGenModal = false;
  
  // Trail and auto-zoom properties
  private trailPolyline: L.Polyline | undefined;
  private trailPoints: [number, number][] = [];
  private hasAutoZoomed = false;

  // Dynamic countdown signals
  countdownMinutes = signal(0);
  countdownSeconds = signal(10);
  estimatedArrival = signal("");
  statusMessage = signal("Llegando pronto");

  // Demo locations (Madrid)
  // Rider always starts from Gran Vía (center of Madrid)
  private riderStartLoc: [number, number] = [40.4192, -3.7032]; // Gran Vía, Madrid
  private userLoc: [number, number] = [40.4243, -3.6917]; // Default: Cibeles/Retiro area

  // Audio Preload
  private preloadedGoodbyeAudioUrl: string | null = null;

  ngOnInit() {
    // Get user location from query params (set by checkout)
    this.route.queryParams.subscribe((params) => {
      if (params["lat"] && params["lng"]) {
        // Use the address coordinates from checkout
        this.userLoc = [parseFloat(params["lat"]), parseFloat(params["lng"])];
      }
      
      if (params["name"]) {
        this.riderName.set(params["name"]);
        this.fetchRiderProfile(params["name"]);
      }
    });

    // Estimated arrival time will be calculated when route is loaded in startSimulation
    // Set a default for now
    const now = new Date();
    const defaultArrivalTime = new Date(now.getTime() + 12000); // Default 12 seconds
    this.estimatedArrival.set(
      defaultArrivalTime.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    // Preload Goodbye Audio
    const name = this.session.user()?.name || "amigo";
    const goodbyeMessage = `Genial ${name}, tu pedido ya ha llegado. Esperamos que disfrutes de tu comida y muchas gracias por haber hecho el pedido con nosotros.`;
    
    this.polly.preload(goodbyeMessage).then(url => {
        console.log("👋 Goodbye audio ready");
        this.preloadedGoodbyeAudioUrl = url;
    }).catch(err => console.error("Error preloading goodbye audio:", err));
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
    // Center map between rider start (Sol) and user destination
    const centerLat = (this.riderStartLoc[0] + this.userLoc[0]) / 2;
    const centerLng = (this.riderStartLoc[1] + this.userLoc[1]) / 2;
    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false, // We want a clean app look
      attributionControl: false,
    }).setView([centerLat, centerLng], 13);

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
    // Restaurant marker at rider start location (Gran Vía - Centro de Madrid)
    L.marker(this.riderStartLoc, { icon: restaurantIcon }).addTo(this.map);
    // User destination marker
    L.marker(this.userLoc, { icon: userIcon }).addTo(this.map);

    // 5. Create Rider Marker (We'll move this one)
    // Rider always starts from Gran Vía (center of Madrid)
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

    // Rider starts from Gran Vía (center of Madrid), not from restaurant
    this.riderMarker = L.marker(this.riderStartLoc, {
      icon: riderIcon,
      zIndexOffset: 1000,
    }).addTo(this.map);
  }

  private startSimulation() {
    // Rider always starts from Gran Vía (center of Madrid), goes to user destination
    this.mapService
      .getRoute(this.riderStartLoc, this.userLoc)
      .subscribe((route) => {
        if (!route || !this.map) return;

        this.routePath = route.coordinates;
        
        // Calculate duration based on distance (10-15 seconds)
        // Distance is in meters, we'll scale it to 10-15 seconds
        const distanceKm = route.distance / 1000; // Convert to kilometers
        // For distances up to 2km: 10 seconds, for longer distances: up to 15 seconds
        // Linear interpolation: 0km = 10s, 5km+ = 15s
        const minDuration = 10;
        const maxDuration = 15;
        const maxDistanceKm = 5; // 5km = max duration
        const duration = Math.min(
          maxDuration,
          Math.max(minDuration, minDuration + (distanceKm / maxDistanceKm) * (maxDuration - minDuration))
        );
        this.totalDuration = duration;
        this.simulationStartTime = Date.now();
        
        // Update estimated arrival time based on calculated duration
        const now = new Date();
        const arrivalTime = new Date(now.getTime() + duration * 1000);
        this.estimatedArrival.set(
          arrivalTime.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

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
    
    // Update trail
    this.trailPoints.push(newPos);
    // Keep only last 20 points for trail
    if (this.trailPoints.length > 20) {
      this.trailPoints.shift();
    }
    
    // Redraw trail
    if (this.trailPolyline) {
      this.map.removeLayer(this.trailPolyline);
    }
    if (this.trailPoints.length > 1) {
      this.trailPolyline = L.polyline(this.trailPoints, {
        color: '#4f46e5',
        weight: 3,
        opacity: 0.6,
        dashArray: '5, 10',
      }).addTo(this.map);
    }

    if (elapsedSeconds < this.totalDuration) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    } else {
      // Arrived!
      this.isDelivered = true;
      
      // Play Goodbye Audio
      if (this.preloadedGoodbyeAudioUrl) {
          const audio = new Audio(this.preloadedGoodbyeAudioUrl);
          audio.play().catch(e => console.error("Error playing goodbye audio", e));
      } else {
          // Fallback if not ready
          const name = this.session.user()?.name || "amigo";
          this.polly.speak(`Genial ${name}, tu pedido ya ha llegado. Disfruta de tu comida.`);
      }

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

  // Removed submitLead - now using direct calendar link

  private fetchRiderProfile(name: string) {
    this.http
      .get(`${environment.apiBaseUrl}/rider/profile-preview?name=${name}`)
      .subscribe({
        next: (profile: any) => {
          console.log("Fetched Rider Profile:", profile);
          this.riderProfile.set(profile);
        },
        error: (err) => console.error("Error fetching rider profile:", err),
      });
  }
}

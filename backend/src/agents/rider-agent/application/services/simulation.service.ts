import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { Rider } from '../../domain/entities/rider.entity';
import { RiderProfileFactory } from './rider-profile.factory';

@Injectable()
export class SimulationService {
  private server: Server;
  private activeSimulations: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly riderProfileFactory: RiderProfileFactory) {}

  // Basic "Rider" state
  private activeRider: Rider;

  // A simple straight line path for demo (Lat/Lng) - Approx 1km distance
  // Just a few points to interpolate between
  private routePoints = [
    { lat: 40.416775, lng: -3.70379 }, // Start: Puerta del Sol, Madrid
    { lat: 40.417, lng: -3.7035 },
    { lat: 40.4172, lng: -3.703 },
    { lat: 40.4175, lng: -3.7025 },
    { lat: 40.418, lng: -3.702 }, // End: Near Seville Metro
  ];

  setServer(server: Server) {
    this.server = server;
  }

  /**
   * Generates a dynamic route and starts simulation
   */
  async startSimulation(
    tenantId: string,
    from?: { lat: number; lng: number },
    to?: { lat: number; lng: number },
    riderName: string = 'Marco Rossi', // Default if not provided
  ) {
    if (this.activeSimulations.has(tenantId)) {
      clearInterval(this.activeSimulations.get(tenantId));
    }

    // Generate Profile based on Name
    const profile = await this.riderProfileFactory.generateProfile(riderName);

    // Initialize Rider with new profile
    this.activeRider = new Rider(
      `rider-${Date.now()}`,
      tenantId,
      riderName,
      'delivering',
      profile.profileImageUrl,
      profile.vehicleDesc,
    );

    // Use dynamic points if provided, otherwise fallback to default Madrid route
    let points = this.routePoints;
    if (from && to) {
      points = this.interpolatePoints(from, to, 10); // Generate 10 steps
    }

    let step = 0;
    const totalSteps = points.length;

    console.log(
      `[Simulation] Started for ${tenantId} (Rider: ${riderName}) from ${from?.lat},${from?.lng} to ${to?.lat},${to?.lng}`,
    );

    const interval = setInterval(() => {
      if (step >= totalSteps) {
        step = 0; // Loop
      }

      this.activeRider.current_location = points[step];
      this.activeRider.last_active = new Date(); // Update activity

      // Emit Event
      if (this.server) {
        this.server.emit('rider_update', {
          tenantId: tenantId,
          rider: this.activeRider,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for "Traffic Limit" (Demo feature)
      // Hardcoded: If at step 2, simulate a delay alert
      if (step === 2) {
        this.server.emit('incident_alert', {
          type: 'TRAFFIC_DELAY',
          message: 'Rider is stuck in heavy traffic directly ahead.',
          severity: 'medium',
          eta_impact: '+5 mins',
        });
      }

      step++;
    }, 2000); // Update every 2 seconds

    this.activeSimulations.set(tenantId, interval);
    return { status: 'Simulation Started', riderId: this.activeRider.id };
  }

  // Linear interpolation to create a smooth path between two points
  private interpolatePoints(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    steps: number,
  ) {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t,
      });
    }
    return points;
  }
}

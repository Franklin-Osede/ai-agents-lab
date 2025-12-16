import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { Rider } from '../../domain/entities/rider.entity';

@Injectable()
export class SimulationService {
  private server: Server;
  private activeSimulations: Map<string, NodeJS.Timeout> = new Map();

  // Basic "Rider" state
  private activeRider: Rider = new Rider(
    'rider-123',
    'tenant-demo', // Default demo tenant
    'Marco Rossi',
    'delivering',
  );

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

  startSimulation(tenantId: string) {
    if (this.activeSimulations.has(tenantId)) {
      clearInterval(this.activeSimulations.get(tenantId));
    }

    let step = 0;
    const totalSteps = this.routePoints.length;

    console.log(`[Simulation] Started for ${tenantId}`);

    const interval = setInterval(() => {
      if (step >= totalSteps) {
        // Loop for demo purposes
        step = 0;
      }

      const location = this.routePoints[step];

      // Update Rider State
      this.activeRider.current_location = location;

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
}

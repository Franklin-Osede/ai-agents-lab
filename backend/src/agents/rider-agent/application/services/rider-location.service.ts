import { Injectable, Logger } from '@nestjs/common';

export interface GeoCoordinates {
  lat: number;
  lng: number;
  address: string;
}

export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
  price: number;
}

@Injectable()
export class RiderLocationService {
  private readonly logger = new Logger(RiderLocationService.name);

  /**
   * Mock Geocoding for MVP (Will connect to Amazon Location Service later)
   */
  async geocode(address: string): Promise<GeoCoordinates> {
    this.logger.log(`Geocoding address: ${address}`);

    // Mock Data for Demo (Spain + US)
    const lowerAddr = address.toLowerCase();

    // Madrid
    if (lowerAddr.includes('atocha'))
      return { lat: 40.4068, lng: -3.6906, address: 'Estación de Atocha, Madrid' };
    if (lowerAddr.includes('sol') || lowerAddr.includes('centro'))
      return { lat: 40.4168, lng: -3.7038, address: 'Puerta del Sol, Madrid' };
    if (lowerAddr.includes('bernabeu'))
      return { lat: 40.453, lng: -3.6883, address: 'Santiago Bernabéu, Madrid' };

    // Barcelona
    if (lowerAddr.includes('sagrada'))
      return { lat: 41.4036, lng: 2.1744, address: 'Sagrada Familia, BCN' };
    if (lowerAddr.includes('aeropuerto'))
      return { lat: 41.2974, lng: 2.0833, address: 'El Prat Airport, BCN' };

    // NY (Legacy Demo)
    if (lowerAddr.includes('central park')) {
      return { lat: 40.7829, lng: -73.9654, address: 'Central Park, NY' };
    }
    if (lowerAddr.includes('jfk') || lowerAddr.includes('airport')) {
      return { lat: 40.6413, lng: -73.7781, address: 'JFK Airport, NY' };
    }

    // Default: Gran Vía, Madrid (Spain Default)
    return { lat: 40.4207, lng: -3.7042, address: 'Gran Vía, Madrid' };
  }

  /**
   * Calculate Route Price & Duration
   */
  async calculateRoute(pickup: GeoCoordinates, dropoff: GeoCoordinates): Promise<RouteInfo> {
    // Simple Haversine or Euclidean mock
    const distance =
      Math.sqrt(Math.pow(pickup.lat - dropoff.lat, 2) + Math.pow(pickup.lng - dropoff.lng, 2)) *
      111; // Approx degrees to km

    return {
      distanceKm: parseFloat(distance.toFixed(2)),
      durationMin: Math.ceil(distance * 2), // Mock: 2 mins per km
      price: parseFloat((distance * 1.5 + 5).toFixed(2)), // Base $5 + $1.5/km
    };
  }
}

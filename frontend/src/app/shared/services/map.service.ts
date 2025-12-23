import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, of } from "rxjs"; // Added 'of' for catchError if needed, or simple mocks

@Injectable({
  providedIn: "root",
})
export class MapService {
  // Nominatim is the search engine for OpenStreetMap
  private readonly GEOCODING_API = "https://nominatim.openstreetmap.org/search";

  // OSRM is the routing machine for getting street paths
  private readonly ROUTING_API =
    "https://router.project-osrm.org/route/v1/driving";

  private http = inject(HttpClient);

  /**
   * Turns a text address (e.g., "Gran Via, Madrid") into Coordinates
   */
  searchAddress(query: string): Observable<any[]> {
    return this.http.get<any[]>(this.GEOCODING_API, {
      params: {
        q: query,
        format: "json",
        limit: "5",
        addressdetails: "1",
      },
    });
  }

  /**
   * Gets the actual street path between two points
   * @param startCoords [lat, lng]
   * @param endCoords [lat, lng]
   */
  getRoute(
    startCoords: [number, number],
    endCoords: [number, number]
  ): Observable<any> {
    // OSRM expects "lng,lat" (longitude first!)
    const start = `${startCoords[1]},${startCoords[0]}`;
    const end = `${endCoords[1]},${endCoords[0]}`;

    return this.http
      .get(`${this.ROUTING_API}/${start};${end}`, {
        params: {
          overview: "full",
          geometries: "geojson", // Returns the exact line shape of the road
        },
      })
      .pipe(
        map((response: any) => {
          if (!response.routes || response.routes.length === 0) return null;

          const route = response.routes[0];
          return {
            distance: route.distance, // Meters
            duration: route.duration, // Seconds
            coordinates: route.geometry.coordinates.map((c: number[]) => [
              c[1],
              c[0],
            ]), // Flip back to [lat, lng] for Leaflet
          };
        })
      );
  }

  /**
   * INTERPOLATION HELPER
   * Calculates exactly where the rider is based on how much time has passed.
   *
   * @param path The full list of coordinates for the route
   * @param totalDurationSeconds How long the trip takes total
   * @param elapsedTimeSeconds How long the rider has been driving
   */
  interpolatePosition(
    path: [number, number][],
    totalDurationSeconds: number,
    elapsedTimeSeconds: number
  ): [number, number] {
    if (!path || path.length === 0) return [0, 0];
    if (elapsedTimeSeconds >= totalDurationSeconds)
      return path[path.length - 1]; // Arrived
    if (elapsedTimeSeconds <= 0) return path[0]; // Not started

    // Calculate progress (0.0 to 1.0)
    const progress = elapsedTimeSeconds / totalDurationSeconds;

    // Find the index in the array
    // (This is a simplified linear interpolation. For perfect speed checking we'd weigh by distance segments,
    // but for a visual demo, this works incredibly well)
    const exactIndex = progress * (path.length - 1);
    const index = Math.floor(exactIndex);
    const textNextIndex = Math.min(index + 1, path.length - 1);

    // Get the two points we are between
    const p1 = path[index];
    const p2 = path[textNextIndex];

    // Local progress between these two specific points
    const localProgress = exactIndex - index;

    // Linear interpolate between p1 and p2
    const lat = p1[0] + (p2[0] - p1[0]) * localProgress;
    const lng = p1[1] + (p2[1] - p1[1]) * localProgress;

    return [lat, lng];
  }
}

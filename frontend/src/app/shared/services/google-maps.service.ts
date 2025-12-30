import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

declare let google: any;

export interface PlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  name?: string;
  address_components?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private autocompleteService: any;
  private placesService: any;
  private geocoder: any;
  private isLoaded = false;
  private loadSubject = new Subject<boolean>();

  constructor() {
    this.loadGoogleMaps();
  }

  /**
   * Load Google Maps API script
   */
  private loadGoogleMaps(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.initializeServices();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.getApiKey()}&libraries=places,geocoding`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.initializeServices();
      this.isLoaded = true;
      this.loadSubject.next(true);
    };
    script.onerror = () => {
      console.error('Error loading Google Maps API');
      this.loadSubject.next(false);
    };
    document.head.appendChild(script);
  }

  /**
   * Initialize Google Maps services
   */
  private initializeServices(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
      this.geocoder = new google.maps.Geocoder();
    }
  }

  /**
   * Get API key from environment
   */
  private getApiKey(): string {
    return environment.googleMapsApiKey || 'YOUR_GOOGLE_MAPS_API_KEY';
  }

  /**
   * Wait for Google Maps to load
   */
  waitForLoad(): Observable<boolean> {
    if (this.isLoaded) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }
    return this.loadSubject.asObservable();
  }

  /**
   * Get place predictions (autocomplete)
   */
  getPlacePredictions(input: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        this.waitForLoad().subscribe(loaded => {
          if (loaded) {
            this.getPlacePredictions(input).then(resolve).catch(reject);
          } else {
            reject(new Error('Google Maps failed to load'));
          }
        });
        return;
      }

      if (!input || input.length < 3) {
        resolve([]);
        return;
      }

      this.autocompleteService.getPlacePredictions(
        {
          input: input,
          // Removed country restriction to allow global addresses
          types: ['address'] // Only addresses
        },
        (predictions: any[], status: string) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else {
            resolve([]);
          }
        }
      );
    });
  }

  /**
   * Get place details by place_id
   */
  getPlaceDetails(placeId: string): Promise<PlaceResult> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        this.waitForLoad().subscribe(loaded => {
          if (loaded) {
            this.getPlaceDetails(placeId).then(resolve).catch(reject);
          } else {
            reject(new Error('Google Maps failed to load'));
          }
        });
        return;
      }

      this.placesService.getDetails(
        {
          placeId: placeId,
          fields: ['place_id', 'formatted_address', 'geometry', 'name', 'address_components']
        },
        (place: PlaceResult, status: string) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error(`Place details error: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Geocode an address
   */
  geocodeAddress(address: string): Promise<PlaceResult> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        this.waitForLoad().subscribe(loaded => {
          if (loaded) {
            this.geocodeAddress(address).then(resolve).catch(reject);
          } else {
            reject(new Error('Google Maps failed to load'));
          }
        });
        return;
      }

      this.geocoder.geocode({ address: address }, (results: any[], status: string) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const result = results[0];
          resolve({
            place_id: result.place_id,
            formatted_address: result.formatted_address,
            geometry: result.geometry,
            address_components: result.address_components
          });
        } else {
          reject(new Error(`Geocoding error: ${status}`));
        }
      });
    });
  }
}

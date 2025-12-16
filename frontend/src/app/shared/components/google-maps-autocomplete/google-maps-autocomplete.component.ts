import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { GoogleMapsService, PlaceResult } from '../../services/google-maps.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-google-maps-autocomplete',
  templateUrl: './google-maps-autocomplete.component.html',
  styleUrls: ['./google-maps-autocomplete.component.scss'],
  standalone: true,
  imports: [FormsModule]
})
export class GoogleMapsAutocompleteComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Buscar dirección...';
  @Input() initialValue = '';
  @Input() label = 'Dirección';
  @Output() placeSelected = new EventEmitter<PlaceResult>();
  @Output() addressChange = new EventEmitter<string>();

  @ViewChild('inputElement', { static: false }) inputElement!: ElementRef<HTMLInputElement>;

  private googleMapsService = inject(GoogleMapsService);

  addressValue = '';
  predictions: any[] = [];
  showPredictions = false;
  isLoading = false;
  selectedPlace: PlaceResult | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    if (this.initialValue) {
      this.addressValue = this.initialValue;
    }

    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.isLoading = true;
        return this.googleMapsService.getPlacePredictions(query);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (predictions) => {
        this.predictions = predictions || [];
        this.showPredictions = this.predictions.length > 0;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error getting predictions:', error);
        this.isLoading = false;
        this.predictions = [];
        this.showPredictions = false;
      }
    });
  }

  onInputChange(value: string): void {
    this.addressValue = value;
    this.addressChange.emit(value);
    
    if (value && value.length >= 3) {
      this.searchSubject.next(value);
    } else {
      this.predictions = [];
      this.showPredictions = false;
      this.selectedPlace = null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Select a prediction
   */
  selectPrediction(prediction: any): void {
    this.addressValue = prediction.description;
    this.showPredictions = false;
    this.isLoading = true;

    // Get place details
    this.googleMapsService.getPlaceDetails(prediction.place_id)
      .then(place => {
        this.selectedPlace = place;
        this.placeSelected.emit(place);
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error getting place details:', error);
        this.isLoading = false;
      });
  }

  /**
   * Clear selection
   */
  clear(): void {
    this.addressValue = '';
    this.selectedPlace = null;
    this.predictions = [];
    this.showPredictions = false;
    this.placeSelected.emit(null as any);
    this.addressChange.emit('');
  }

  /**
   * Handle input focus
   */
  onFocus(): void {
    if (this.predictions.length > 0) {
      this.showPredictions = true;
    }
  }

  /**
   * Handle input blur
   */
  onBlur(): void {
    // Delay to allow click on prediction
    setTimeout(() => {
      this.showPredictions = false;
    }, 200);
  }

  /**
   * Get formatted address
   */
  getFormattedAddress(): string {
    return this.selectedPlace?.formatted_address || this.addressValue || '';
  }

  /**
   * Get coordinates
   */
  getCoordinates(): { lat: number; lng: number } | null {
    if (!this.selectedPlace?.geometry?.location) {
      return null;
    }
    return {
      lat: this.selectedPlace.geometry.location.lat(),
      lng: this.selectedPlace.geometry.location.lng()
    };
  }
}

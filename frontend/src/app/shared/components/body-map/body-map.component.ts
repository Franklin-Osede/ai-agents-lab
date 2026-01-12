import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-body-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './body-map.component.html',
  styleUrls: ['./body-map.component.scss']
})
export class BodyMapComponent {
  @Input() view: 'front' | 'back' = 'front';
  @Input() selectable = true;
  @Output() partSelected = new EventEmitter<string>();

  // State to track hover/selection if needed visually
  hoveredPart = signal<string | null>(null);
  selectedPart = signal<string | null>(null);

  selectPart(partName: string) {
    if (!this.selectable) return;
    this.selectedPart.set(partName);
    this.partSelected.emit(partName);
  }
}

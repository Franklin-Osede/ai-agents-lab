import { Component, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-super-app-home',
  templateUrl: './super-app-home.component.html',
  styleUrls: [], // No separate style file used as Tailwind is used in HTML
  standalone: true,
  imports: [RouterModule]
})
export class SuperAppHomeComponent {
  @Input({ transform: booleanAttribute }) dialog = false;
  @Output() modalClose = new EventEmitter<void>();

  onBack(event?: Event) {
    if (this.dialog) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.modalClose.emit();
    }
  }
}

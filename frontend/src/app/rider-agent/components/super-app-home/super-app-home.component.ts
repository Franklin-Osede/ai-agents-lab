import {
  Component,
  Input,
  Output,
  EventEmitter,
  booleanAttribute,
  signal,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-super-app-home",
  templateUrl: "./super-app-home.component.html",
  styleUrls: [], // No separate style file used as Tailwind is used in HTML
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class SuperAppHomeComponent implements OnInit, OnDestroy {
  @Input({ transform: booleanAttribute }) dialog = false;
  @Output() modalClose = new EventEmitter<void>();

  currentTime = signal<string>("9:41");
  private timeInterval: any;

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 60000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    this.currentTime.set(`${hours}:${minutes}`);
  }

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

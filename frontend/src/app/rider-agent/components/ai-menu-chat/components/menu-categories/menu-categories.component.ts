import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-menu-categories",
  standalone: true,
  imports: [CommonModule],
  template: `
    @if(options.length > 0) {
    <div class="flex flex-col gap-2 p-2 pt-4">
      @for(opt of options; track opt) {
      <button
        (click)="optionSelected.emit(opt)"
        class="text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
      >
        {{ opt }}
      </button>
      }
    </div>
    }
  `,
  styles: [],
})
export class MenuCategoriesComponent {
  @Input() options: string[] = [];
  @Output() optionSelected = new EventEmitter<string>();
}

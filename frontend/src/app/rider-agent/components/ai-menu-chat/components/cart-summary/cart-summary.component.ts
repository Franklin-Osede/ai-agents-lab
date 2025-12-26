import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-cart-summary",
  standalone: true,
  imports: [CommonModule],
  template: `
    @if(count > 0) {
    <!-- Wrapper to center positioned content relative to viewport/container -->
    <div
      class="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[428px] pointer-events-none z-[60] flex justify-center"
    >
      <div class="pointer-events-auto animate-[slideUp_0.3s_ease-out]">
        <button
          (click)="viewOrder.emit()"
          class="bg-slate-900 text-white pl-4 pr-5 py-3 rounded-full shadow-xl flex items-center gap-3 border border-slate-800 hover:scale-105 transition-transform active:scale-95"
        >
          <div
            class="bg-white/20 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
          >
            {{ count }}
          </div>
          <span class="font-bold text-sm"
            >Ver Pedido ({{ total | currency : "EUR" }})</span
          >
        </button>
      </div>
    </div>
    }
  `,
  styles: [],
})
export class CartSummaryComponent {
  @Input() count: number = 0;
  @Input() total: number = 0;
  @Output() viewOrder = new EventEmitter<void>();
}

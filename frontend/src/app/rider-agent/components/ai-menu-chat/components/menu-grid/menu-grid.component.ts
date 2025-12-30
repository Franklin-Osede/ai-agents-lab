import { Component, Input, Output, EventEmitter, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuCard } from "../../../../services/menu-data.service";
import { CartService } from "../../../../../shared/services/cart.service";

@Component({
  selector: "app-menu-grid",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex gap-4 pl-[52px] overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory"
    >
      @for (card of cards; track card.name) {
      <div
        (click)="cardClicked.emit(card)"
        (keydown.enter)="cardClicked.emit(card)"
        tabindex="0"
        class="snap-center shrink-0 w-64 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group/card text-left cursor-pointer transition-all hover:shadow-md relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <!-- Tooltip on Hover -->
        <div
          class="absolute inset-0 z-10 bg-black/60 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity p-4 text-white text-center rounded-2xl pointer-events-none"
        >
          <p class="text-sm font-medium">{{ card.description }}</p>
        </div>

        <div class="relative h-40 overflow-hidden">
          <div
            class="w-full h-full bg-cover bg-center"
            [style.background-image]="'url(' + card.image + ')'"
          ></div>
          <div
            class="absolute top-3 left-3 bg-white/95 px-3 py-1.5 rounded-xl shadow-sm border border-slate-100"
          >
            <span class="text-base font-extrabold text-indigo-600">{{
              card.price | currency : "EUR" : "symbol" : "1.2-2"
            }}</span>
          </div>
          @if (card.bestValue) {
          <div
            class="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-lg"
          >
            <span class="text-[10px] font-bold uppercase tracking-wide"
              >Best Value</span
            >
          </div>
          }
        </div>
        <div class="p-4 flex flex-col gap-3">
          <div>
            <h3 class="font-bold text-slate-900 leading-tight">
              {{ card.name }}
            </h3>
            <div class="flex items-center gap-2 mt-1.5">
              @for (tag of card.tags; track tag) {
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 uppercase tracking-wide"
                >{{ tag }}</span
              >
              }
            </div>
          </div>
          @if (getQuantity(card) > 0) {
          <div
            class="flex items-center justify-between bg-slate-100 rounded-lg p-1 relative z-20 h-9"
          >
            <button
              (click)="$event.stopPropagation(); remove.emit(card)"
              class="w-8 h-full flex items-center justify-center text-slate-600 hover:text-red-500"
            >
              <span class="material-symbols-outlined text-sm">remove</span>
            </button>
            <span class="font-bold text-sm text-slate-900">{{
              getQuantity(card)
            }}</span>
            <button
              (click)="handleAddClick($event, card)"
              class="w-8 h-full flex items-center justify-center text-slate-600 hover:text-green-600"
            >
              <span class="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
          } @else {
          <button
            (click)="handleAddClick($event, card)"
            class="w-full h-9 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors relative z-20"
          >
            Añadir
          </button>
          }
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export class MenuGridComponent {
  @Input() cards: MenuCard[] = [];
  @Output() cardClicked = new EventEmitter<MenuCard>();
  @Output() add = new EventEmitter<MenuCard>();
  @Output() remove = new EventEmitter<MenuCard>();

  // Inject CartService directly for quantity state to avoid prop drilling complex maps
  private cartService = inject(CartService);

  getQuantity(item: MenuCard): number {
    return this.cartService.getQuantity(item.name);
  }

  handleAddClick(event: Event, card: MenuCard) {
    event.stopPropagation();
    event.preventDefault();
    console.log("📦 MenuGridComponent: Emitting add event for:", card.name);
    this.add.emit(card);
  }
}

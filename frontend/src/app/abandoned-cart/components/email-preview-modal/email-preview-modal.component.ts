import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-email-preview-modal',
  standalone: true,
  imports: [],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="modalClose.emit()" (keydown.escape)="modalClose.emit()" tabindex="0" role="button">
      <div class="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0" role="alertdialog" aria-modal="true">
        <!-- Email Header (Gmail Style) -->
        <div class="bg-zinc-100 dark:bg-zinc-800 p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="size-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">A</div>
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-white">RecoverPRO Store</h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">para {{ customerName }}</p>
            </div>
          </div>
          <button (click)="modalClose.emit()" class="size-8 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors">
            <span class="material-symbols-outlined text-zinc-500">close</span>
          </button>
        </div>

        <!-- Subject Line -->
        <div class="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 class="text-lg font-semibold text-zinc-800 dark:text-zinc-100">¡No olvides tus productos! 🛒</h2>
          <p class="text-xs text-zinc-400 mt-1">Hoy, 10:42 AM</p>
        </div>

        <!-- Email Body -->
        <div class="p-6 bg-white dark:bg-zinc-900 max-h-[60vh] overflow-y-auto">
          <p class="text-zinc-600 dark:text-zinc-300 mb-4 text-sm leading-relaxed">Hola <strong>{{ customerName }}</strong>,</p>
          <p class="text-zinc-600 dark:text-zinc-300 mb-6 text-sm leading-relaxed">Notamos que dejaste algunos artículos increíbles en tu carrito. ¡Están esperándote!</p>
          
          <!-- Product Card inside Email -->
          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-700 mb-6 flex gap-4">
            <div class="size-16 bg-white rounded-lg border border-zinc-200 flex items-center justify-center text-2xl">📦</div>
            <div>
              <p class="font-bold text-zinc-900 dark:text-white text-sm">Tu Carrito de Compras</p>
              <p class="text-zinc-500 text-xs mt-1">Total: <strong>\${{ totalValue }}</strong></p>
              <p class="text-blue-600 text-xs mt-2 font-medium">Ver productos...</p>
            </div>
          </div>

          <p class="text-zinc-600 dark:text-zinc-300 mb-6 text-sm">Completa tu compra ahora y recibe envío gratis en las próximas 2 horas.</p>
          
          <div class="text-center">
            <button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-95">
              Recuperar mi Carrito
            </button>
          </div>
          
          <div class="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p class="text-xs text-zinc-400">© 2024 RecoverPRO Inc.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EmailPreviewModalComponent {
  @Input() customerName = 'Cliente';
  @Input() totalValue = 0;
  @Output() modalClose = new EventEmitter<void>();
}

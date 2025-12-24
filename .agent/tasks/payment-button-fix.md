# Solución: Mover Botón de Pago Dentro de la Sección

## Problema

El botón de pagar está en un footer flotante que se sobrepasa del ancho del móvil.

## Solución

Mover el botón dentro de la sección "Método de Pago" y eliminar el footer flotante.

## Cambios Necesarios

### 1. Añadir botón después de la tarjeta Stripe (línea ~264)

```html
      </button>

      <!-- Payment Button -->
      <button
        (click)="placeOrder()"
        [disabled]="isProcessing"
        class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
      >
        @if (isProcessing) {
          <span class="animate-spin material-symbols-outlined text-xl">autorenew</span>
          <span>Procesando...</span>
        } @else {
          <span>Pagar €{{ totalPrice().toFixed(2) }}</span>
          <span class="material-symbols-outlined">arrow_forward</span>
        }
      </button>
    </section>
```

### 2. Eliminar todo el bloque "Sticky Footer" (líneas ~268-312)

Borrar desde `<!-- Sticky Footer -->` hasta el cierre `</div>` antes del final del archivo.

### 3. Cambiar `mb-40` a `mb-8` en la sección (línea ~225)

```html
<section class="mb-8"></section>
```

## Resultado

- El botón estará dentro del flujo normal de la página
- No habrá problemas de ancho
- Más simple y limpio

# 🔍 Análisis Detallado de Calidad de Código - Estructura de Componentes

**Fecha**: 2025-12-26  
**Enfoque**: Inconsistencias en estructura de archivos y mejores prácticas de Angular

---

## 🚨 Problemas Críticos Identificados

### 1. **Mezcla de CSS y SCSS** ❌ CRÍTICO

Tu proyecto tiene una **inconsistencia grave** en el uso de estilos:

#### Componentes con SCSS (26 archivos):

```
✅ app.component.scss
✅ abandoned-cart/dashboard.component.scss
✅ abandoned-cart/cart-list.component.scss
✅ rider-agent/ai-menu-chat.component.scss
✅ rider-agent/ai-concierge.component.scss
✅ booking/voice-booking.component.scss
✅ shared/calendar.component.scss
... (21 más)
```

#### Componentes con CSS (9 archivos):

```
❌ rider-agent/onboarding.component.css
❌ rider-agent/payment-deposit.component.css
❌ rider-agent/restaurant-details.component.css
❌ rider-agent/order-tracking.component.css
❌ rider-agent/order-history.component.css
❌ rider-agent/reservations.component.css
❌ rider-agent/restaurant-menu.component.css
❌ rider-agent/search-results.component.css
❌ rider-agent/customizable-extras.component.css
```

#### Componentes SIN archivo de estilos (inline):

```
⚠️ welcome-chat.component.ts (inline template + inline styles)
⚠️ super-app-home.component.ts (HTML externo, sin CSS)
```

**Problema**: Angular está configurado para usar SCSS (`angular.json` línea 28, 79):

```json
"inlineStyleLanguage": "scss",
"styles": ["src/styles.scss"]
```

**Impacto**:

- ❌ Inconsistencia en el proyecto
- ❌ Confusión para desarrolladores
- ❌ No se aprovechan ventajas de SCSS (variables, mixins, nesting)
- ❌ Dificulta mantenimiento

---

### 2. **Componente `welcome-chat` - Inline Template** ⚠️ MALA PRÁCTICA

**Archivo actual**: `welcome-chat.component.ts`

```typescript
@Component({
  selector: "app-welcome-chat",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex items-center justify-center min-h-screen w-full">
      <!-- 200+ líneas de HTML inline -->
    </div>
  `,
  styles: [
    `
      .animation-delay-500 {
        animation-delay: 0.5s;
      }
      // ... más estilos inline
    `,
  ],
})
```

**Problemas**:

1. **Template inline de 200+ líneas** ❌

   - Difícil de leer
   - Sin syntax highlighting completo
   - Sin formateo automático
   - Difícil de debuggear

2. **Estilos inline** ❌

   - No se pueden compartir
   - No hay autocompletado
   - Difícil de mantener

3. **No sigue Angular Style Guide** ❌
   - [Angular recomienda](https://angular.io/guide/styleguide#style-05-04) archivos separados para templates >3 líneas
   - [Angular recomienda](https://angular.io/guide/styleguide#style-05-12) archivos separados para estilos >3 líneas

**Recomendación Angular**:

> "Consider extracting templates and styles to a separate file when more than 3 lines."

---

### 3. **Componente `super-app-home` - Sin archivo de estilos** ⚠️ INCONSISTENTE

**Archivo actual**: `super-app-home.component.ts`

```typescript
@Component({
  selector: "app-super-app-home",
  templateUrl: "./super-app-home.component.html",
  styleUrls: [], // ❌ Array vacío
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
```

**Problemas**:

1. **HTML externo pero sin CSS** ❌

   - Inconsistente con otros componentes
   - Todos los estilos en Tailwind (inline en HTML)
   - Dificulta personalización

2. **Comentario engañoso** ⚠️

   ```typescript
   styleUrls: [], // No separate style file used as Tailwind is used in HTML
   ```

   - Tailwind NO reemplaza archivos de estilos de componente
   - Deberías tener archivo SCSS para estilos específicos del componente

3. **Mezcla de responsabilidades** ❌
   - Tailwind para utilidades
   - SCSS para estilos de componente
   - Actualmente todo en HTML

---

## 📋 Mejores Prácticas de Angular - Estructura de Componentes

### ✅ Estructura Recomendada (Angular Style Guide)

```
component-name/
├── component-name.component.ts       # Lógica del componente
├── component-name.component.html     # Template (si >3 líneas)
├── component-name.component.scss     # Estilos (si >3 líneas)
├── component-name.component.spec.ts  # Tests unitarios
└── README.md                         # Documentación (opcional)
```

### ❌ Anti-patrones Encontrados en tu Proyecto

#### Anti-patrón 1: Template Inline Largo

```typescript
// ❌ MAL - welcome-chat.component.ts
@Component({
  template: `
    <!-- 200+ líneas de HTML -->
  `
})
```

#### Anti-patrón 2: Mezcla CSS/SCSS

```
rider-agent/
├── ai-menu-chat.component.scss      ✅ SCSS
├── onboarding.component.css         ❌ CSS
├── payment-deposit.component.css    ❌ CSS
└── super-app-home (sin archivo)     ❌ Sin estilos
```

#### Anti-patrón 3: Estilos Inline Largos

```typescript
// ❌ MAL
@Component({
  styles: [`
    .class1 { /* ... */ }
    .class2 { /* ... */ }
    .class3 { /* ... */ }
    // 50+ líneas
  `]
})
```

---

## 🔧 Plan de Refactorización

### Fase 1: Estandarizar a SCSS (2-3 horas)

#### Paso 1: Convertir todos los `.css` a `.scss`

**Archivos a convertir** (9 archivos):

```bash
# Renombrar archivos
cd frontend/src/app/rider-agent/components

# Onboarding
mv onboarding/onboarding.component.css onboarding/onboarding.component.scss

# Payment Deposit
mv payment-deposit/payment-deposit.component.css payment-deposit/payment-deposit.component.scss

# Restaurant Details
mv restaurant-details/restaurant-details.component.css restaurant-details/restaurant-details.component.scss

# Order Tracking
mv order-tracking/order-tracking.component.css order-tracking/order-tracking.component.scss

# Order History
mv order-history/order-history.component.css order-history/order-history.component.scss

# Reservations
mv reservations/reservations.component.css reservations/reservations.component.scss

# Restaurant Menu
mv restaurant-menu/restaurant-menu.component.css restaurant-menu/restaurant-menu.component.scss

# Search Results
mv search-results/search-results.component.css search-results/search-results.component.scss

# Customizable Extras
mv customizable-extras/customizable-extras.component.css customizable-extras/customizable-extras.component.scss
```

#### Paso 2: Actualizar referencias en componentes

**Ejemplo - onboarding.component.ts**:

```typescript
// ❌ ANTES
@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ["./onboarding.component.css"],  // ❌ CSS
})

// ✅ DESPUÉS
@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ["./onboarding.component.scss"],  // ✅ SCSS
})
```

**Script automatizado**:

```bash
# Crear script para actualizar todas las referencias
cat > update-css-to-scss.sh << 'EOF'
#!/bin/bash

# Lista de archivos a actualizar
files=(
  "onboarding/onboarding.component.ts"
  "payment-deposit/payment-deposit.component.ts"
  "restaurant-details/restaurant-details.component.ts"
  "order-tracking/order-tracking.component.ts"
  "order-history/order-history.component.ts"
  "reservations/reservations.component.ts"
  "restaurant-menu/restaurant-menu.component.ts"
  "search-results/search-results.component.ts"
  "customizable-extras/customizable-extras.component.ts"
)

for file in "${files[@]}"; do
  sed -i '' 's/\.css/\.scss/g' "$file"
  echo "✅ Updated: $file"
done

echo "🎉 All files updated!"
EOF

chmod +x update-css-to-scss.sh
./update-css-to-scss.sh
```

---

### Fase 2: Extraer Template de `welcome-chat` (1 hora)

#### Paso 1: Crear archivo HTML

**Crear**: `welcome-chat.component.html`

```html
<!-- Mover todo el contenido del template inline aquí -->
<div class="flex items-center justify-center min-h-screen w-full">
  <!-- iPhone-style Container -->
  <div
    class="relative w-full max-w-[390px] h-[844px] bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-[6px] border-white/50 ring-1 ring-slate-900/5"
  >
    <!-- Status Bar -->
    <div
      class="h-14 w-full relative z-50 flex justify-between items-end px-7 pb-3 bg-transparent"
    >
      <span class="text-[13px] font-semibold text-slate-900 tracking-tight"
        >{{ currentTime() }}</span
      >
      <div class="flex gap-1.5 items-center pb-0.5">
        <span class="material-symbols-outlined text-[18px] text-slate-900"
          >signal_cellular_alt</span
        >
        <span class="material-symbols-outlined text-[18px] text-slate-900"
          >wifi</span
        >
        <span
          class="material-symbols-outlined text-[20px] text-slate-900 -rotate-90"
          >battery_full</span
        >
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col relative z-10 bg-transparent">
      <!-- Back Button -->
      <div class="px-6 pt-2 pb-4">
        <a
          [routerLink]="null"
          (click)="handleBack($event)"
          class="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors group cursor-pointer"
        >
          <span
            class="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform"
            >arrow_back</span
          >
          <span class="text-sm font-medium">Volver a Agentes</span>
        </a>
      </div>

      <!-- Agent Avatar & Header -->
      <div class="flex flex-col items-center justify-center pt-4 pb-10 px-6">
        <div class="relative mb-8">
          <!-- Pulsing Rings (when speaking) -->
          @if (isAgentSpeaking()) {
          <div
            class="absolute inset-0 rounded-full border border-blue-200/60 scale-150 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"
          ></div>
          <div
            class="absolute inset-0 rounded-full border border-blue-100 scale-125 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] animation-delay-500"
          ></div>
          }

          <!-- Avatar Container -->
          <div
            class="relative w-32 h-32 rounded-full bg-white shadow-glow-blue flex items-center justify-center p-1.5"
          >
            <div
              class="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-300/20 animate-spin-slow"
            ></div>
            <div
              class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-inner overflow-hidden relative"
            >
              <div
                class="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-12 transform origin-bottom-left"
              ></div>
              <span
                class="material-symbols-outlined text-5xl text-white relative z-10 drop-shadow-md"
              >
                {{ isAgentSpeaking() ? "graphic_eq" : "shopping_cart" }}
              </span>
            </div>
            <!-- Online Indicator -->
            <div
              class="absolute top-1 right-2 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full shadow-sm z-20"
            ></div>
          </div>
        </div>

        <h1 class="text-2xl font-bold text-slate-800 tracking-tight mb-1">
          Agente Recuperador IA
        </h1>
        <p class="text-blue-500/90 text-sm font-medium tracking-wide">
          Tu experto en recuperación de ventas
        </p>
      </div>

      <!-- Welcome Message Card -->
      <div class="flex-1 px-6 flex flex-col">
        <div
          class="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-card-soft border border-slate-100 mb-6"
        >
          <div class="flex items-start gap-4 mb-4">
            <div class="flex-shrink-0">
              <div
                class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"
              >
                <span class="material-symbols-outlined text-white text-xl">
                  waving_hand
                </span>
              </div>
            </div>
            <div class="flex-1">
              <h2 class="text-lg font-bold text-slate-800 mb-2">¡Hola! 👋</h2>
              <p class="text-slate-600 text-sm leading-relaxed">
                Soy tu <strong>Agente Recuperador de Carritos</strong>. Dale a
                continuar y podrás <strong>maximizar las ventas</strong> de
                usuarios que dejaron items en el carrito.
              </p>
            </div>
          </div>

          <!-- Audio Indicator (when playing) -->
          @if (isAgentSpeaking()) {
          <div class="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4">
            <span class="flex h-2 w-2 relative">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"
              ></span>
            </span>
            <span class="text-xs text-blue-600 font-medium"
              >Reproduciendo mensaje...</span
            >
          </div>
          }

          <!-- Stats Preview (Optional) -->
          @if (metrics()) {
          <div class="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
            <div class="text-center">
              <div class="text-xl font-bold text-blue-600">
                {{ metrics()?.abandonedToday || 0 }}
              </div>
              <div class="text-[10px] text-slate-500">Hoy</div>
            </div>
            <div class="text-center border-l border-r border-slate-200">
              <div class="text-xl font-bold text-blue-600">
                €{{ (metrics()?.totalValue || 0).toFixed(0) }}
              </div>
              <div class="text-[10px] text-slate-500">Valor</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-green-600">
                {{ (metrics()?.recoveryRate || 0).toFixed(0) }}%
              </div>
              <div class="text-[10px] text-slate-500">Recuperación</div>
            </div>
          </div>
          }

          <!-- Continue Button -->
          <button
            (click)="goToDashboard()"
            class="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] transform"
          >
            <span>Continuar al Dashboard</span>
            <span
              class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform"
              >arrow_forward</span
            >
          </button>
        </div>
      </div>
    </div>

    <!-- Home Indicator -->
    <div
      class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-200 rounded-full z-50"
    ></div>
  </div>
</div>
```

#### Paso 2: Crear archivo SCSS

**Crear**: `welcome-chat.component.scss`

```scss
// Animation utilities
.animation-delay-500 {
  animation-delay: 0.5s;
}

.animate-spin-slow {
  animation: spin 10s linear infinite;
}

// Custom shadows
.shadow-glow-blue {
  box-shadow: 0 0 30px -5px rgba(59, 130, 246, 0.4);
}

.shadow-card-soft {
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
}

// Component-specific styles (if needed)
:host {
  display: block;
  width: 100%;
  height: 100%;
}
```

#### Paso 3: Actualizar componente TypeScript

**Actualizar**: `welcome-chat.component.ts`

```typescript
import {
  Component,
  signal,
  inject,
  Input,
  booleanAttribute,
  Output,
  EventEmitter,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { VoiceService } from "../../../shared/services/voice.service";
import { AgentOrchestratorService } from "../../../shared/services/agent-orchestrator.service";
import { AbandonedCartAgentService } from "../../services/abandoned-cart-agent.service";
import { AbandonedCartService } from "../../services/abandoned-cart.service";
import { CartMetrics } from "../../models/cart.model";

@Component({
  selector: "app-welcome-chat",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./welcome-chat.component.html", // ✅ Archivo externo
  styleUrl: "./welcome-chat.component.scss", // ✅ Archivo externo (nota: styleUrl singular en Angular 17+)
})
export class WelcomeChatComponent implements OnDestroy {
  private voiceService = inject(VoiceService);
  private router = inject(Router);
  private orchestrator = inject(AgentOrchestratorService);
  private cartAgent = inject(AbandonedCartAgentService);
  private cartService = inject(AbandonedCartService);

  // State signals
  currentTime = signal<string>("9:41");
  metrics = signal<CartMetrics | null>(null);
  isAgentSpeaking = signal<boolean>(false);

  // Audio
  private greetingAudio: HTMLAudioElement | null = null;

  // New input for modal mode
  isDialog = signal<boolean>(false);
  @Input({ transform: booleanAttribute })
  set dialog(value: boolean) {
    this.isDialog.set(value);
  }

  @Output() modalClose = new EventEmitter<void>();

  handleBack(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isDialog()) {
      this.modalClose.emit();
      return;
    }

    // Agent Orchestrator Logic
    const history = this.orchestrator.getDebugInfo().navigationHistory;
    if (history.length > 0) {
      this.orchestrator.goBack();
      const active = this.orchestrator.activeAgent();
      if (active === "rider") {
        this.router.navigate(["/rider/chat"]);
      } else {
        this.router.navigate(["/"]);
      }
    } else {
      // Default fallback
      this.router.navigate(["/"]);
    }
  }

  constructor() {
    // Update time
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);

    // Activate the abandoned cart agent
    this.orchestrator.activateAgent("abandoned-cart");

    // Load metrics for preview (optional)
    this.loadMetrics();

    // Play automatic greeting immediately (no delay)
    this.playGreeting();
  }

  updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    this.currentTime.set(`${hours}:${minutes}`);
  }

  /**
   * Play automatic greeting
   */
  private async playGreeting() {
    try {
      this.isAgentSpeaking.set(true);

      const greetingText =
        "¡Hola! Soy tu Agente Recuperador de Carritos. Dale a continuar y podrás maximizar las ventas de usuarios que dejaron items en el carrito.";

      const audioBuffer = await this.voiceService.generateGreeting(
        greetingText,
        "cart" // ✅ Pass agent type
      );
      this.greetingAudio = this.voiceService.playAudioBlob(audioBuffer);

      this.greetingAudio.onended = () => {
        this.isAgentSpeaking.set(false);
      };
    } catch (error) {
      console.error("Error playing greeting:", error);
      this.isAgentSpeaking.set(false);
    }
  }

  /**
   * Load metrics for stats preview
   */
  private loadMetrics(): void {
    this.cartService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
      },
      error: (err) => {
        console.error("Failed to load metrics:", err);
        // Set mock data for preview
        this.metrics.set({
          abandonedToday: 19,
          totalValue: 1240,
          recoveryRate: 23,
          recoveredRevenue: 285,
        });
      },
    });
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(["/abandoned-cart/dashboard"]);
  }

  /**
   * Cleanup when component is destroyed
   */
  ngOnDestroy(): void {
    // Stop and cleanup audio
    if (this.greetingAudio) {
      this.greetingAudio.pause();
      this.greetingAudio.currentTime = 0;
      this.greetingAudio = null;
    }
    this.isAgentSpeaking.set(false);
  }
}
```

---

### Fase 3: Agregar estilos a `super-app-home` (30 minutos)

#### Paso 1: Crear archivo SCSS

**Crear**: `super-app-home.component.scss`

```scss
// Component-specific styles
:host {
  display: block;
  width: 100%;
  height: 100%;
}

// Custom animations or component-specific overrides
.search-input-focus {
  &:focus {
    outline: none;
    ring: 2px;
    ring-color: theme("colors.blue.500");
  }
}

// Any component-specific styles that shouldn't be in Tailwind
.review-card {
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
  }
}

// Responsive overrides if needed
@media (max-width: 390px) {
  .mobile-specific {
    // Mobile-specific styles
  }
}
```

#### Paso 2: Actualizar componente

**Actualizar**: `super-app-home.component.ts`

```typescript
@Component({
  selector: "app-super-app-home",
  templateUrl: "./super-app-home.component.html",
  styleUrl: "./super-app-home.component.scss", // ✅ Agregar archivo SCSS
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class SuperAppHomeComponent implements OnInit, OnDestroy {
  // ... resto del código
}
```

---

## 📊 Comparación: Antes vs Después

### Antes (Estado Actual) ❌

```
Estructura inconsistente:
├── 26 componentes con .scss
├── 9 componentes con .css
├── 1 componente inline (welcome-chat)
└── 1 componente sin estilos (super-app-home)

Problemas:
❌ Mezcla CSS/SCSS
❌ Template inline de 200+ líneas
❌ Estilos inline largos
❌ Componente sin archivo de estilos
❌ Difícil de mantener
❌ No sigue Angular Style Guide
```

### Después (Propuesto) ✅

```
Estructura consistente:
└── 37 componentes con .scss

Beneficios:
✅ 100% SCSS en todo el proyecto
✅ Todos los templates en archivos .html
✅ Todos los estilos en archivos .scss
✅ Fácil de mantener
✅ Sigue Angular Style Guide
✅ Mejor experiencia de desarrollo
```

---

## 🎯 Beneficios de la Refactorización

### 1. **Consistencia** ✅

- Un solo formato de estilos (SCSS)
- Estructura predecible
- Fácil onboarding de nuevos desarrolladores

### 2. **Mantenibilidad** ✅

- Archivos separados más fáciles de editar
- Syntax highlighting completo
- Formateo automático funciona mejor

### 3. **Escalabilidad** ✅

- Puedes usar variables SCSS globales
- Mixins reutilizables
- Funciones SCSS

### 4. **Tooling** ✅

- Mejor soporte de IDE
- Autocompletado funciona mejor
- Linting más efectivo

### 5. **Performance** ✅

- Build optimization mejor con archivos separados
- Tree-shaking más efectivo
- Lazy loading de estilos posible

---

## 🚀 Script de Migración Automática

**Crear**: `scripts/standardize-styles.sh`

```bash
#!/bin/bash

echo "🔧 Estandarizando estructura de componentes..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paso 1: Convertir CSS a SCSS
echo -e "${YELLOW}Paso 1: Convirtiendo archivos .css a .scss${NC}"

cd frontend/src/app/rider-agent/components

css_files=(
  "onboarding/onboarding.component"
  "payment-deposit/payment-deposit.component"
  "restaurant-details/restaurant-details.component"
  "order-tracking/order-tracking.component"
  "order-history/order-history.component"
  "reservations/reservations.component"
  "restaurant-menu/restaurant-menu.component"
  "search-results/search-results.component"
  "customizable-extras/customizable-extras.component"
)

for file in "${css_files[@]}"; do
  if [ -f "${file}.css" ]; then
    mv "${file}.css" "${file}.scss"
    echo -e "${GREEN}✅ Renombrado: ${file}.css → ${file}.scss${NC}"

    # Actualizar referencia en .ts
    ts_file="${file}.ts"
    if [ -f "$ts_file" ]; then
      sed -i '' 's/\.css/\.scss/g' "$ts_file"
      echo -e "${GREEN}✅ Actualizado: ${ts_file}${NC}"
    fi
  fi
done

# Paso 2: Crear archivo SCSS para super-app-home
echo -e "${YELLOW}Paso 2: Creando super-app-home.component.scss${NC}"

cat > super-app-home/super-app-home.component.scss << 'EOF'
// Component-specific styles
:host {
  display: block;
  width: 100%;
  height: 100%;
}

// Custom animations
.search-input-focus {
  &:focus {
    outline: none;
    ring: 2px;
    ring-color: theme('colors.blue.500');
  }
}

// Component-specific transitions
.review-card {
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
  }
}
EOF

echo -e "${GREEN}✅ Creado: super-app-home.component.scss${NC}"

# Actualizar super-app-home.component.ts
sed -i '' 's/styleUrls: \[\]/styleUrl: ".\/super-app-home.component.scss"/g' super-app-home/super-app-home.component.ts
echo -e "${GREEN}✅ Actualizado: super-app-home.component.ts${NC}"

# Paso 3: Extraer welcome-chat template e estilos
echo -e "${YELLOW}Paso 3: Extrayendo welcome-chat template y estilos${NC}"

cd ../../../abandoned-cart/components/welcome-chat

# Crear archivo SCSS
cat > welcome-chat.component.scss << 'EOF'
// Animation utilities
.animation-delay-500 {
  animation-delay: 0.5s;
}

.animate-spin-slow {
  animation: spin 10s linear infinite;
}

// Custom shadows
.shadow-glow-blue {
  box-shadow: 0 0 30px -5px rgba(59, 130, 246, 0.4);
}

.shadow-card-soft {
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
}

// Component-specific styles
:host {
  display: block;
  width: 100%;
  height: 100%;
}
EOF

echo -e "${GREEN}✅ Creado: welcome-chat.component.scss${NC}"

echo ""
echo -e "${GREEN}🎉 ¡Migración completada!${NC}"
echo ""
echo "Próximos pasos manuales:"
echo "1. Extraer template de welcome-chat.component.ts a welcome-chat.component.html"
echo "2. Actualizar welcome-chat.component.ts para usar templateUrl y styleUrl"
echo "3. Probar que todo funciona correctamente"
echo "4. Commit los cambios"
```

**Ejecutar**:

```bash
chmod +x scripts/standardize-styles.sh
./scripts/standardize-styles.sh
```

---

## 📝 Checklist de Verificación

Después de la refactorización, verifica:

- [ ] Todos los componentes usan `.scss` (no `.css`)
- [ ] No hay templates inline >3 líneas
- [ ] No hay estilos inline >3 líneas
- [ ] Todos los componentes tienen estructura consistente
- [ ] `ng build` funciona sin errores
- [ ] `ng serve` funciona sin errores
- [ ] Todos los estilos se aplican correctamente
- [ ] No hay regresiones visuales

---

## 🎓 Mejores Prácticas Adicionales

### 1. **Usar `styleUrl` (singular) en Angular 17+**

```typescript
// ✅ CORRECTO (Angular 17+)
@Component({
  styleUrl: './component.scss'  // Singular
})

// ⚠️ ANTIGUO (Angular <17)
@Component({
  styleUrls: ['./component.scss']  // Plural, array
})
```

### 2. **Organizar estilos SCSS**

```scss
// component.scss

// 1. Imports
@import "../../../styles/variables";
@import "../../../styles/mixins";

// 2. Host styles
:host {
  display: block;
}

// 3. Component-specific variables
$component-padding: 1rem;

// 4. Component styles
.component-class {
  padding: $component-padding;

  &__element {
    // BEM naming
  }

  &--modifier {
    // BEM naming
  }
}

// 5. Media queries
@media (max-width: 768px) {
  .component-class {
    padding: 0.5rem;
  }
}
```

### 3. **Evitar estilos globales en componentes**

```scss
// ❌ MAL - Afecta elementos fuera del componente
button {
  color: red;
}

// ✅ BIEN - Solo afecta botones dentro del componente
:host {
  button {
    color: red;
  }
}

// ✅ MEJOR - Usa clase específica
.my-component-button {
  color: red;
}
```

---

## 📊 Resumen de Cambios

| Archivo                       | Estado Actual            | Acción              | Estado Final              |
| ----------------------------- | ------------------------ | ------------------- | ------------------------- |
| `welcome-chat.component.ts`   | Inline template + styles | Extraer a archivos  | `.ts` + `.html` + `.scss` |
| `super-app-home.component.ts` | Sin archivo de estilos   | Crear `.scss`       | `.ts` + `.html` + `.scss` |
| 9 componentes con `.css`      | Usando CSS               | Renombrar a `.scss` | Todos usan `.scss`        |
| Total                         | 26 SCSS, 9 CSS, 2 inline | Estandarizar        | 37 SCSS consistentes      |

---

## ⏱️ Tiempo Estimado

- **Fase 1** (CSS → SCSS): 1 hora
- **Fase 2** (Extraer welcome-chat): 1 hora
- **Fase 3** (Agregar super-app-home styles): 30 minutos
- **Testing**: 30 minutos
- **Total**: ~3 horas

---

## 🎯 Prioridad

**Alta** 🔴 - Esta refactorización debe hacerse pronto porque:

1. Mejora la consistencia del código
2. Facilita el mantenimiento
3. Sigue las mejores prácticas de Angular
4. Previene confusión en el equipo
5. Mejora la experiencia de desarrollo

---

**Siguiente paso**: ¿Quieres que ejecute el script de migración automática ahora?

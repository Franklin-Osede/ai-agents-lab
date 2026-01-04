# Prompts para Generación de UI (v0.dev / Bolt / Claude Artifacts)

## Brand Colors (Tu Branding Real - Azul/Morado)

```css
Primary: #4f46e5 (Azul índigo)
Secondary: #7c3aed (Morado)
Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Accent Light: #667eea (Azul claro)
Accent Dark: #764ba2 (Morado oscuro)
Background Dark: #1f2937
Background Light: #f9fafb
Text Dark: #1f2937
Text Light: #ffffff
Border: #e5e7eb
```

---

## Pantalla 1: URL Input Screen (Reemplazo de "Seleccionar Doctor")

### Prompt para v0.dev/Bolt

```
Create a modern, clean URL input screen for a SaaS AI platform with the following specs:

DESIGN SYSTEM:
- Primary color: #4f46e5 (indigo blue)
- Secondary: #7c3aed (purple)
- Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Background: White (#f9fafb) with subtle gradient
- Font: Inter or similar modern sans-serif

LAYOUT:
- Centered card on white/light gray background
- Card has subtle shadow and rounded corners (24px)
- Mobile-first, responsive design

CONTENT:
- Header: "Conecta tu Negocio"
- Subheader: "Introduce la URL de tu web para que la IA aprenda automáticamente"
- Large input field with icon (🌐) for URL
  - Placeholder: "https://tu-clinica.com"
  - Validation: Must be valid URL
- Primary button: "Escanear Sitio Web" (indigo blue #4f46e5, white text)
  - Loading state with spinner
  - Disabled state when input empty
- Secondary link button: "Usar datos de ejemplo" (text only, blue color)

FEATURES:
- Input has focus state with blue border glow (#4f46e5)
- Button has hover effect (slightly darker blue)
- Error message appears below input if URL invalid (red text)
- Success checkmark animation when URL is valid

STYLE:
- Clean, professional, trustworthy
- Not too playful, suitable for B2B SaaS
- Subtle animations (no excessive motion)
- Accessibility: proper labels, ARIA attributes

Export as React/Angular component with TypeScript
```

---

## Pantalla 2: Knowledge Preview Screen (Nueva - Mostrar lo Escaneado)

### Prompt para v0.dev/Bolt

```
Create a "Knowledge Preview" dashboard screen for an AI SaaS platform:

DESIGN SYSTEM:
- Primary: #4f46e5 (indigo), Secondary: #7c3aed (purple)
- Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Card-based layout with white cards on light gray background (#f9fafb)
- Modern, clean, data-focused design

LAYOUT:
- Header section:
  - Title: "Conocimiento Extraído"
  - Subtitle: "Revisa la información que la IA aprendió de tu sitio web"
  - Source URL badge (small, gray, with link icon)

- Main content: 3-column grid (responsive to 1 column on mobile)

  COLUMN 1 - Servicios Detectados:
  - Card with indigo accent border-top (#4f46e5)
  - Icon: 💼
  - List of services with checkmarks
  - Each service shows: Name + Price (if found)
  - "Agregar servicio" button at bottom (outline style)

  COLUMN 2 - Información de Contacto:
  - Card with purple accent border-top (#7c3aed)
  - Icon: 📞
  - Phone number (if found)
  - Email (if found)
  - Address (if found)
  - Business hours (if found)
  - Empty state: "No se encontró información de contacto"

  COLUMN 3 - Equipo/Profesionales:
  - Card with gradient accent border-top
  - Icon: 👥
  - List of team members (if found)
  - Each with: Name, Role, Photo placeholder
  - Empty state: "No se detectaron profesionales"

- Footer section:
  - Stats bar: "X servicios • Y páginas escaneadas • Z minutos"
  - Two buttons:
    - "Volver a escanear" (outline, gray)
    - "Continuar al Chat" (solid, indigo #4f46e5) - Primary CTA

FEATURES:
- Each card has subtle hover effect
- Empty states are friendly, not alarming
- Loading skeleton states for async data
- Edit icons next to each item (pencil icon, appears on hover)
- Smooth fade-in animation when data loads

STYLE:
- Professional, data-dashboard aesthetic
- Similar to Linear.app or Notion
- Clean typography hierarchy
- Generous white space
- Subtle shadows on cards

Export as React/Angular component with mock data structure
```

---

## Pantalla 3: Enhanced Chat Interface (Chat + Body Map + Knowledge Context)

### Prompt para v0.dev/Bolt

```
Create a split-screen chat interface for a physiotherapy AI agent:

DESIGN SYSTEM:
- Primary: #4f46e5 (indigo), Secondary: #7c3aed (purple)
- Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Chat bubbles: User (indigo gradient), AI (light gray)
- Modern messaging app aesthetic

LAYOUT:
Desktop (2-column):
- LEFT (60%): Chat conversation
- RIGHT (40%): Interactive Body Map + Knowledge Panel

Mobile (stacked):
- Chat on top
- Body Map as expandable drawer from bottom

LEFT PANEL - Chat:
- Header:
  - Avatar (AI agent icon)
  - Name: "Asistente de [Clinic Name]"
  - Status: "En línea" (blue dot)
  - Info icon (shows knowledge source on click)

- Messages area:
  - User messages: Right-aligned, indigo gradient background, white text
  - AI messages: Left-aligned, light gray background (#f9fafb), dark text
  - Timestamp below each message (small, gray)
  - Typing indicator (3 animated dots in indigo)

- Input area:
  - Text input with placeholder: "Describe tu dolor o consulta..."
  - Microphone icon (voice input)
  - Send button (indigo #4f46e5, paper plane icon)
  - Character counter (subtle, gray)

RIGHT PANEL - Body Map + Context:
- Tabs at top:
  - "Mapa Corporal" (active - indigo underline)
  - "Servicios"
  - "Información"

- TAB 1 - Body Map:
  - Interactive SVG body diagram (front/back toggle)
  - Clickable zones (highlight on hover with indigo)
  - Selected zone shows indigo outline
  - Label below: "Selecciona la zona de dolor"

- TAB 2 - Servicios:
  - List of available services from knowledge base
  - Each with: Icon, Name, Price, Duration
  - Click to mention in chat

- TAB 3 - Información:
  - Quick facts from knowledge base
  - Hours, Location, Contact
  - "Ver más" expands

FEATURES:
- Auto-scroll to latest message
- Message grouping by time
- "Scroll to bottom" button when scrolled up
- Body Map selection auto-fills chat input
- Smooth transitions between tabs
- Responsive: Right panel becomes bottom sheet on mobile

INTERACTIONS:
- Click body part → Chat input fills with "Tengo dolor en [zona]"
- Click service → Chat input fills with "¿Cuánto cuesta [servicio]?"
- Voice button → Opens voice recording modal

STYLE:
- Modern messaging app (WhatsApp/Telegram inspired)
- Clean, minimal, focused on conversation
- Indigo/purple accents for primary actions
- Subtle animations (message slide-in, typing indicator)

Export as React/Angular component with sample conversation
```

---

## Pantalla 4: Training Overlay (Actualizada con Branding Azul/Morado)

### Prompt para v0.dev/Bolt

```
Create a "Training in Progress" overlay screen for AI knowledge ingestion:

DESIGN SYSTEM:
- Primary: #4f46e5 (indigo), Secondary: #7c3aed (purple)
- Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Dark theme background: #1f2937
- Accent indigo/purple for progress indicators

LAYOUT:
- Full-screen overlay (modal)
- Centered card (max-width: 900px)
- Semi-transparent dark background

CARD CONTENT:
- Header:
  - Title: "Entrenando tu Agente de IA"
  - Subtitle: "Analizando tu sitio web..."
  - Progress bar (indigo to purple gradient fill)
  - Percentage: "45%" (large, white text)

- Main area (2-column grid):

  LEFT - Terminal Log:
  - Dark code editor aesthetic (#0d1117 background)
  - Terminal header with 3 dots (red, yellow, green)
  - Monospace font (Courier New or Fira Code)
  - Indigo text (#667eea)
  - Animated logs scrolling:
    - "> Conectando con servidor..."
    - "> Escaneando página principal..."
    - "> ENCONTRADO: Sección de servicios"
    - "> Detectado: Fisioterapia Deportiva - 50€"
  - Blinking cursor at end

  RIGHT - Checklist:
  - Title: "Progreso"
  - List of steps with checkboxes:
    - ✓ Conectando con tu web (completed - indigo)
    - ✓ Leyendo contenido (completed - indigo)
    - ⏳ Identificando servicios (in progress - purple)
    - ⬜ Analizando precios (pending - gray)
    - ⬜ Configurando agente (pending - gray)
  - Smooth check animation when step completes

- Footer:
  - Info text: "Esto puede tomar 30-60 segundos"
  - Cancel button (text only, gray) - optional

FEATURES:
- Progress bar fills smoothly with gradient (CSS transition)
- Logs appear with fade-in animation
- Checkmarks animate with scale + fade
- Percentage updates every second
- Auto-close when 100% reached

STYLE:
- Hacker/terminal aesthetic but polished
- Indigo/purple matrix-style but professional
- Similar to GitHub Copilot loading screen
- Dark, focused, shows technical work happening

ANIMATIONS:
- Log lines fade in from top
- Progress bar smooth fill (ease-in-out)
- Checkmarks pop in with bounce
- Cursor blinks every 500ms

Export as React/Angular component with animation hooks
```

---

## Pantalla 5: Niche Selector (Reemplazo de Landing Actual)

### Prompt para v0.dev/Bolt

```
Create a niche selection screen for a multi-vertical AI SaaS platform:

DESIGN SYSTEM:
- Primary: #4f46e5 (indigo), Secondary: #7c3aed (purple)
- Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Clean, modern, card-based layout
- White background (#f9fafb) with subtle texture

LAYOUT:
- Hero section:
  - Title: "Elige tu Especialidad"
  - Subtitle: "Selecciona el tipo de negocio para personalizar tu agente de IA"

- Grid of niche cards (2x2 on desktop, 1 column on mobile):

  CARD STRUCTURE (each):
  - Large icon at top (emoji or SVG)
  - Title (bold, large)
  - Short description (2 lines max)
  - "Seleccionar" button (outline, indigo)
  - Hover effect: Slight lift + shadow increase + indigo border glow

  NICHES:
  1. Fisioterapia
     - Icon: 🏥 or medical cross
     - Description: "Gestión de citas y consultas de rehabilitación"

  2. Clínica Dental
     - Icon: 🦷 or tooth
     - Description: "Reservas y consultas odontológicas"

  3. Belleza y Estética
     - Icon: ✨ or spa icon
     - Description: "Tratamientos estéticos y cuidado personal"

  4. Restaurante
     - Icon: 🍽️ or chef hat
     - Description: "Pedidos y reservas de mesa"

- Footer:
  - "¿No encuentras tu sector? Contáctanos" (link in indigo)

FEATURES:
- Cards have subtle border on hover (indigo)
- Selected card shows indigo border
- Click animation (scale down slightly)
- Responsive grid (4 cols → 2 cols → 1 col)

STYLE:
- Clean, professional, B2B SaaS
- Similar to Stripe or Linear.app
- Generous padding and white space
- Subtle shadows on cards
- Indigo/purple accents for interactive elements

INTERACTIONS:
- Hover: Card lifts 4px, shadow increases, indigo border appears
- Click: Navigate to URL input for that niche
- Keyboard navigation support (tab through cards)

Export as React/Angular component with routing logic
```

---

## Notas de Implementación

### Para v0.dev:

1. Copia cada prompt individualmente
2. Genera la UI
3. Descarga el código React/Angular
4. Adapta los estilos a tu proyecto

### Para Bolt.new:

1. Pega el prompt completo
2. Especifica "Angular 17+ with Signals"
3. Pide que use tu estructura de carpetas existente

### Para Claude Artifacts:

1. Usa los prompts como están
2. Pide "Generate as Angular component"
3. Copia el código generado a tu proyecto

---

## Orden de Implementación Recomendado

1. **Niche Selector** (Pantalla 5) - Punto de entrada
2. **URL Input** (Pantalla 1) - Captura de datos
3. **Training Overlay** (Pantalla 4) - Feedback visual
4. **Knowledge Preview** (Pantalla 2) - Transparencia
5. **Enhanced Chat** (Pantalla 3) - Experiencia final

Cada pantalla es independiente y puede generarse/testearse por separado.

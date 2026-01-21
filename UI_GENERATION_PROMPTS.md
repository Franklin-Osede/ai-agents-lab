# Prompts para Generación de UI (v0.dev / Bolt / Claude Artifacts)

## 🌍 Contexto del Mundo: "AgentsMinds"

> **Instrucción Global:** Copia este contexto antes de cada prompt para que la IA entienda el "Vibe".

**El Concepto:**
"AgentsMinds" no es solo un SaaS, es un **Laboratorio Futurista de Inteligencia Artificial**. Aquí, los negocios tradicionales (clínicas, despachos, tiendas) vienen a "clonar" su cerebro empresarial.
La plataforma ofrece un "Magic Onboarding": Pones una URL y, en segundos, nace un **Empleado Digital** completamente formado.

**El Vibe (Look & Feel):**

- **Estilo:** "Futuristic Lab meets Clean SaaS".
- **Modo:** **LIGHT MODE** (Predominante). Blanco, gris perla (#f3f4f6), y cristal.
- **Acento:** Índigo Eléctrico (#4f46e5) y Violeta Profundo (#7c3aed).
- **Sensación:** Limpieza, Tecnología Punta, Confianza, Claridad.
- **Keywords:** Glassmorphism sutil, Sombras suaves (Soft shadows), Bordes redondeados (24px), Tipografía Inter/Geist.

---

## 🎨 Paleta de Colores (Light Mode)

```css
Primary: #4f46e5 (Indigo Eléctrico)
Secondary: #7c3aed (Violeta Mágico)
Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Surface: #ffffff (Blanco Puro)
Background: #f3f4f6 (Gris Perla / Off-White)
Text Primary: #111827 (Casi Negro)
Text Secondary: #6b7280 (Gris Medio)
Border: #e5e7eb (Gris Claro)
Success: #10b981 (Esmeralda)
```

---

## Pantalla 1: Niche Selector (El Hall de Entrada)

**Nombre:** `NicheSelectionComponent`
**Objetivo:** Que el usuario sienta que hay una IA especializada _exactamente_ para él.

### Prompt para v0.dev/Bolt:

```text
Create a "Niche Selection" screen for "AgentsMinds", a premium AI laboratory.

STYLE GUIDE:
- Theme: LIGHT MODE. Crisp white cards on a soft gray background (#f3f4f6).
- Vibe: Premium, Trustworthy, Specialized.
- Colors: Indigo (#4f46e5) for actions/highlights.

LAYOUT:
1. Hero Section (Centered):
   - Headline: "Elige la Mente de tu Agente" (Big, Bold, Dark Text)
   - Subheadline: "Selecciona tu industria para cargar el conocimiento base especializado." (Gray text)

2. The Grid (2x2 or 3x2):
   - Render a grid of beautiful, large cards.
   - CARD STYLE: White background, soft shadow (box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1)), rounded-xl.
   - INTERACTION: On Hover -> Card lifts up slightly, shadow grows, and a thin Indigo border appears.

   - CONTENT PER CARD:
     - Icon: Large, colorful icon in a soft circle background (e.g., Tooth for Dental in light blue bg).
     - Title: "Clínica Dental", "Fisioterapia", "Restaurante", "Despacho Legal".
     - Badge: "Modelo v2.0" (Small pill badge, subtle).
     - Action Arrow: "→" appears on hover.

3. Footer:
   - "Don't see your industry? Request a custom agent."

FEELING:
The user should feel like they are picking a specialized "employee archetype", not just a template.
```

---

## Pantalla 2: URL Input (La "Magic Box")

**Nombre:** `UrlInputComponent`
**Objetivo:** Cero fricción. Solo una caja mágica que lo hace todo.

### Prompt para v0.dev/Bolt:

```text
Create a "Magic URL Input" screen for the AI setup process.

STYLE GUIDE:
- Theme: LIGHT MODE. Clean, airy, spacious.
- Focus: The input field is the HERO. It should look powerful.

LAYOUT:
1. Centered Content (Vertical Stack):
   - Title: "Conecta tu Negocio"
   - Subtitle: "Nuestro escáner neuronal leerá tu web para entrenar a tu agente en segundos."

2. The Input Field (Central & Huge):
   - Style: Large height (64px), white background, strong shadow.
   - Border: Neutral gray usually, but GLOWS Indigo when focused.
   - Placeholder: "https://tu-clinica.com"
   - Icon: A globe or "brain" icon inside the input on the left.
   - Button: "Empezar Entrenamiento" (Gradient Indigo->Purple). NOT a separate button, but integrated or attached to the input bar.

3. Social Proof / Trust (Below input):
   - "🔒 Escaneo seguro y privado"
   - "⚡️ Proceso de 30-60 segundos"

ANIMATION:
- When the user types, the button becomes fully opaque/active.
- When clicked, transition to a "Scanning" state implies a complex backend process starting.
```

---

## Pantalla 3: Training Process (El "Laboratorio")

**Nombre:** `TrainingOverlayComponent`
**Objetivo:** Entretener al usuario mientras espera y MOSTRAR que la IA está trabajando (valor percibido).

### Prompt para v0.dev/Bolt:

```text
Create a "Training in Progress" overlay/modal.

STYLE GUIDE:
- Theme: DARK MODE (Exception!). This specific screen represents the "Inside of the machine".
- Why Dark? To contrast with the rest of the Light app and feel like "Matrix" code is running.
- Background: Deep Indigo/Black (#0f172a).

LAYOUT:
1. Central "Brain" Visualization:
   - An animated central element (pulsing circle or brain icon).
   - Progress Bar: Gradient fill, smooth animation.
   - Percentage: Big bold text "45%".

2. "The Console" (Terminal Output):
   - A code-like looking box below the progress bar.
   - Font: Monospace (Courier/Fira).
   - Text Colors: Green for success, Yellow for processing.
   - LOGS (Animated typing effect):
     > [CONNECTING] www.clinica-ejemplo.com... OK
     > [NEURAL_NET] Extracting services...
     > [FOUND] "Fisioterapia Deportiva"
     > [FOUND] "Osteopatía"
     > [PRICING] Detecting table... Success.
     > [TEACHING] Fine-tuning conversational model...

3. Dynamic "Insight" Cards (Fading in/out):
   - While waiting, show floating cards: "He aprendido que tus horarios son de 9 a 20h".

FEELING:
"Wow, this thing is actually reading my website and learning right now."
```

---

## Pantalla 4: Knowledge Preview (La "Auditoría")

**Nombre:** `KnowledgePreviewComponent`
**Objetivo:** Transparencia. Que el usuario verifique lo aprendido antes de probar.

### Prompt para v0.dev/Bolt:

```text
Create a "Knowledge Audit" dashboard view.

STYLE GUIDE:
- Theme: LIGHT MODE. Information density should be high but readable.
- Metaphor: A clipboard or audit report.

LAYOUT:
1. Header Stats:
   - "34 Servicios Detectados" | "4 Doctores Encontrados" | "Ubicación Confirmada"

2. Two-Column Layout (Desktop):
   - LEFT (Servicios):
     - List of cards for each service found.
     - Each card: Name (Editable), Price (Editable), Duration (Editable).
     - Action: "Add Missing Service".

   - RIGHT (Business Info):
     - "Opening Hours" widget.
     - "Contact Info" widget.
     - "Team Members" list (Avatars + Names).

3. Validation Actions (Bottom Sticky Bar):
   - "Repetir Escaneo" (Secondary)
   - "Confirmar y Entrenar" (Primary, Gradient Big Button).

FEELING:
Control. The user sees the AI is smart, but THEY are the boss who approves the data.
```

---

## Pantalla 5: Enhanced Chat (El "Producto Final")

**Nombre:** `AgentChatComponent`
**Objetivo:** La demo WOW. Donde ocurre la magia con el mapa corporal o la interacción rica.

### Prompt para v0.dev/Bolt:

```text
Create the main "Agent Chat Interface" with a split-screen layout.

STYLE GUIDE:
- Theme: LIGHT MODE.
- Chat Bubbles:
  - AI: White bubble with subtle shadow.
  - User: Indigo Gradient bubble, white text.

LAYOUT (Split Screen):
1. LEFT PANEL (The Chat):
   - Header: Agent Avatar ("Lucía - Asistente Virtual") + Online Status.
   - Message Area: Clean conversation history.
   - Input Area: Modern, pill-shaped input, voice mic icon, send button.

2. RIGHT PANEL (The "Superpower" Widget):
   - Niche: Physiotherapy.
   - Widget: "Interactive Body Map".
   - Graphic: A clean SVG silhouette of a human body (Front/Back).
   - INTERACTION:
     - User clicks "Shoulder" on the map.
     - Chat Input auto-fills: "Me duele el hombro derecho..."
     - Agent context recognizes the zone.

Alternative Widgets (Tabs):
- "Servicios": List of treatments with "Book" buttons.
- "Calendario": A mini calendar for slot selection.

FEELING:
Fluid, integrated, much more than just a text chatbot.
```

---

## Pantalla 6: Agent Dashboard (El "Centro de Mando" - Full ROI View)

**Nombre:** `AgentDashboardComponent`
**Objetivo:** Mostrar con precisión quirúrgica el valor económico y operativo que el agente aporta. No es solo "bonito", es una herramienta financiera.

### Prompt para v0.dev/Bolt:

```text
Create a high-density, professional "Agent ROI Dashboard" with the following "Hyper-Detailed" specifications.

THEME & LAYOUT:
- **Style:** "Stripe Dashboard" meets "Mission Control". High information density, but breathable white space.
- **Grid:** 12-column grid system.
- **Surfaces:** Pure white cards (#ffffff) with 1px border (#e5e7eb) and subtle drop-shadows (shadow-sm).

SECTION 1: HEADER & CONTROLS (Top Bar)
- **Left:** Title "Panel de Control" + Breadcrumb "Home / Agentes / Lucía V2".
- **Right:**
  - Date Range Picker: [ 📅 Últimos 30 días v ] (Dropdown with presets: Today, Week, Month).
  - Export Button: [ ⬇ CSV ] (Outline style).
  - Status Toggle: [ 🟢 Activo / 🔴 Pausado ] (Switch component with clear label).

SECTION 2: ROI & KEY METRICS (The "Money" Row)
- **KPI Card 1: Ingresos Generados**
  - Value: "4.250 €" (Large, Inter Font, Bold).
  - Trend: "↗ +12% vs mes anterior" (Green pill background).
  - Subtext: "Directamente de citas cerradas".
  - Icon: 💶 (Subtle background graphic).
- **KPI Card 2: Horas Ahorradas**
  - Value: "42 horas" (Human time saved).
  - Trend: "≈ 1.5 Empleados TC" (Contextual metric).
  - Tooltip: "Calculado a 5 mins por llamada evitada".
- **KPI Card 3: Eficiencia de Cierre**
  - Value: "18.5%" (Conversion Rate).
  - Detail: "De 200 conv. -> 37 citas".
  - Progress Ring: Visual circle showing the % filled.
- **KPI Card 4: Satisfacción (CSAT)**
  - Value: "4.8/5.0".
  - Stars: ⭐⭐⭐⭐⭐ (Visual representation).

SECTION 3: CONVERSATION ANALYTICS (The Charts)
- **Main Chart (Area Chart - Full Width):**
  - Title: "Volumen de Tráfico & Picos de Demanda".
  - Y-Axis: Cantidad de mensajes.
  - X-Axis: Franjas horarias (00:00 - 23:59).
  - Data Series 1 (Blue fill): Total Conversaciones.
  - Data Series 2 (Purple line): Citas Agendadas.
  - **Interaction:** Hovering over a peak shows a tooltip: "14:00 - 12 Usuarios activos".
- **Side Chart (Donut Chart - 1/3 Width):**
  - Title: "Temas Más Consultados".
  - Segments:
    - "Precios" (40% - Indigo).
    - "Horarios" (25% - Purple).
    - "Dudas Médicas" (20% - Cyan).
    - "Otros" (15% - Gray).
  - Legend: Below chart, clickable to toggle categories.

SECTION 4: LIVE ACTIVITY FEED (The "Pulse")
- **Header:** "Interacciones Recientes (Tiempo Real)".
- **Filters:** [Todos] [Citas] [Preguntas] [Errores].
- **List Items (Detailed Rows):**
  - **Row 1 (Success):**
    - Avatar: User initials (JD) in Green circle.
    - Title: "Juan D. reservó 'Fisioterapia 1h'".
    - Time: "Hace 2 min".
    - Badge: [ ✅ CONFIRMADO ] (Green bg, dark green text).
    - Action: Button [ Ver Chat ] (Ghost style).
  - **Row 2 (Query):**
    - Avatar: User initials (AM) in Blue circle.
    - Title: "Ana M. preguntó por 'Parking cercano'".
    - Answer: "El agente recomendó: Parking Plaza mayor".
    - Badge: [ 🤖 RESPONDIDO ] (Blue bg).
  - **Row 3 (Escalation):**
    - Avatar: User initials (X) in Red circle.
    - Title: "Usuario pidió hablar con humano".
    - Trigger: "No entendió 'Seguro Sanitas'".
    - Badge: [ ⚠️ REQUIERE ATENCIÓN ] (Amber bg).
    - Action: Button [ Entrenar Agente ] (Primary click).

SECTION 5: ACTIONABLE INSIGHTS (The "Improvement" Loop)
- A banner or card distinct from the rest (Soft Gradient bg).
- Icon: 💡 (Lightbulb).
- Text: "Sugerencia de Mejora: 15 usuarios han preguntado por 'Bonos de 10 sesiones' y el agente no tiene esa información."
- Button: [ + Agregar 'Bonos' al Conocimiento ] (Quick Action).

FEELING:
The user should feel like a CEO looking at a high-performing department, not just a tech admin. It's about business results.
```

---

## Pantalla 7: Agent Simulator / Playground (El "Campo de Pruebas Definitivo")

**Nombre:** `AgentPlaygroundComponent`
**Objetivo:** Un entorno seguro y ULTRA-TÉCNICO para que el administrador "rompa" al agente y lo perfeccione antes de lanzarlo.

### Prompt para v0.dev/Bolt:

```text
Create a comprehensive "Advanced Agent Simulator & Debugger" screen.

THEME:
- **Style:** Integrated Development Environment (IDE) feel, but cleaner.
- **Layout:** Three-Pane Layout (Config | Chat | Internals).

PANE 1: CONFIGURATION (Left Sidebar - 25% Width)
- **Header:** "Parámetros del Modelo".
- **Accordion 1: Identidad & Tono**
  - System Prompt Editor: A expanding textarea with syntax highlighting.
  - Preset Dropdown: [ Recepcionista Formal | Colega Empático | Vendedor Agresivo ].
  - Sliders:
    - Temperature (Creatividad): 0.2 [-----O-----] 1.0.
    - Verbosity (Longitud): Breve [---O-------] Extenso.
- **Accordion 2: Conocimiento Activo**
  - List of active knowledge sources with toggles:
    - [x] Web (scraped).
    - [x] PDF Docs.
    - [ ] Google Calendar (Mock).
- **Accordion 3: Variables de Prueba**
  - Form inputs to mock user context:
    - User Name: [ "Carlos" ].
    - Current Time: [ "19:30" ] (Tests "Closed" logic).
    - User History: [ "Client since 2022" ].

PANE 2: INTERACTIVE SIMULATION (Center - 40% Width)
- **Visuals:** Looks exactly like the end-user Mobile Chat, but wrapped in a "Device Frame" (optional) or distinct border.
- **Watermark:** "TEST MODE" diagonal pattern background (subtle).
- **Header Controls:**
  - [ 🔄 Restart Session ] (Reset variables).
  - [ 📱 Mobile View ] / [ 💻 Desktop View ] toggle.
- **Chat Experience:**
  - Standard chat bubbles.
  - **Critical Difference:** Next to EVERY AI message, a small [ 🐞 Debug ] icon appears. Clicking it focuses Pane 3.

PANE 3: X-RAY DEBUGGER (Right Sidebar - 35% Width)
- **Header:** "Traza de Ejecución".
- **Tab System:** [ RAG Search ] [ Reasoning ] [ Tool Calls ].
- **Content - RAG Tab:**
  - "Query Vectorizada": 'dolor de muelas precio'.
  - "Chunks Recuperados" (List):
    1. 📄 *services.html*: "...implante dental desde 800€..." (Score: 0.89).
    2. 📄 *faq.html*: "...urgencias dentales se atienden..." (Score: 0.75).
- **Content - Reasoning Tab:**
  - "Chain of Thought":
    > "User asks for price. Context mentions 800€. Checking intent... Intent is 'Informational'. Formulating response with empathy."
- **Content - Tool Calls Tab:**
  - Log of external actions:
    > [POST] /api/check-availability { date: '2024-05-20' } -> Response: { slots: [] }.
    > Decision: "No slots found, offering alternative."

FOOTER STATUS BAR:
- Latency: "Gen: 450ms | RAG: 120ms | Total: 570ms".
- Token Usage: "Prompt: 1.2k | Compl: 150 | Cost: $0.004".

FEELING:
Empowering. It gives the user "X-Ray vision" into the AI's brain. They understand EXACTLY why the agent said what it said.
```

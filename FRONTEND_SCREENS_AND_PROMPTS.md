# Análisis Frontend: Pantallas y Prompts

## 1. Análisis Backend Final (Pre-Frontend)

¿Queda algo en el Backend?

- **SÍ, un detalle crítico**: La comunicación **WebSockets**.
- Ahora mismo `IngestWebsiteUseCase` devuelve el resultado final.
- Para la pantalla de "Carga Matrix", el frontend necesita recibir eventos _durante_ el proceso (`progress: 10%`, `found_service: "Masaje"`).
- **Acción requerida**: Crear `KnowledgeEventsGateway` (WebSocket) en el backend antes de ir al frontend.

---

## 2. Definición de Pantallas Frontend

Necesitamos 3 pantallas nuevas (Componentes Angular).

### Pantalla 1: `SetupAgentComponent` (El Gancho)

Esta es la Landing de la Demo. Debe ser limpia y persuasiva.

- **Objetivo**: Que pongan la URL.
- **Elementos**:
  - Título H1: "Convierte tu web en un Agente de IA en 60 segundos".
  - Input Url gigante con botón "Generar Agente".
  - Botón secundario "Probar con datos ficticios".
- **Prompt de Generación (v0/Bolt)**:
  > "Create a modern, dark-themed hero section for an AI SaaS. Center stage is a high-quality, glowing input field asking for a 'Company URL'. Below, a primary button 'Create AI Agent' with a magic wand icon. Use Tailwind CSS. Aesthetic: Linear.app style, gradients, glassmorphism. Subtle background animation."

### Pantalla 2: `TrainingOverlayComponent` (El Show)

Esta es la pantalla modal o de transición mientras el backend trabaja.

- **Objetivo**: Entretener y validar (WoW effect).
- **Elementos**:
  - Terminal estilo hacker (texto verde/blanco monospace) scrolleando rápido.
  - Log en tiempo real: `> Scanning /services... FOUND: 12 items`.
  - Barra de progreso circular o lineal.
- **Prompt de Generación**:
  > "Design a 'Knowledge Training' overlay. Dark background with typical coding terminal aesthetic but polished for end-users. Show a live log of 'scanned pages'. Creating a futuristic 'uploading knowledge' animation. Include a checklist that ticks off: 'Reading Web', 'Understanding Services', 'Learning Pricing'."

### Pantalla 3: `AgentInterfaceComponent` (El Resultado)

El chat enriquecido.

- **Objetivo**: La interacción final.
- **Elementos**:
  - Panel Izquierdo: Chat (burbujas).
  - Panel Derecho (Desktop) / Drawer (Móvil): **Knowledge Debugger** (Lo que el bot aprendió) + **Body Map** (si es fisio).
  - Toast Notifications: "💡 Dato aprendido: Abrimos a las 9am".
- **Prompt**:
  > "Split screen layout for AI Chat interface. Left side: Modern chat bubbles (user right, ai left). Right side: An interactive visual panel showing 'Agent Brain'. This panel lists 'Detected Services' as sleek cards. Responsive design: On mobile, the right panel becomes a slide-over drawer."

## 3. Plan de Acción Inmediato

1.  **Backend**: Implementar `KnowledgeEventsGateway` (WebSockets) para emitir progreso.
2.  **Frontend**: Generar `SetupAgentComponent` (Pantalla 1).

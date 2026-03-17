# Flujo Completo: Product Demo - Fisioterapia

## 🎯 Punto de Entrada

Usuario está en la **Landing Page** y ve:

- Botón/Card: "Product Demo - Fisioterapia"
- Click → **INICIA EL FLUJO**

---

## 📱 Secuencia de Pantallas (6 Pasos)

### Pantalla 1: Niche Selector

**Ruta**: `/demo` o `/demo/select-niche`
**Estado**: ✅ HTML generado
**Contenido**:

- Título: "¿Qué necesitas reservar hoy?"
- Cards de categorías:
  - Salud y Bienestar (5 servicios)
  - Clínica Dental (3 servicios)
  - Belleza y Estética (8 servicios)
  - Servicios Profesionales (2 servicios)

**Acción del Usuario**: Click en "Salud y Bienestar"
**Navegación**: → `/demo/physiotherapy/setup`

---

### Pantalla 2: URL Input

**Ruta**: `/demo/physiotherapy/setup`
**Estado**: ✅ HTML generado
**Contenido**:

- Título: "Conecta tu Negocio"
- Input: "https://tu-clinica.com"
- Botón: "Escanear Sitio Web"
- Link: "Usar datos de ejemplo"

**Acción del Usuario**:

- **Opción A**: Introduce URL real → Click "Escanear"
- **Opción B**: Click "Usar datos de ejemplo" (usa URL ficticia)

**Backend**: `POST /api/v1/knowledge/ingest { url, tenantId }`
**Navegación**: → `/demo/physiotherapy/training?sourceId=src-123`

---

### Pantalla 3: Training Overlay

**Ruta**: `/demo/physiotherapy/training?sourceId=src-123`
**Estado**: ✅ HTML generado
**Contenido**:

- Título: "Entrenando tu Agente"
- Progress bar: 0% → 100%
- Terminal con logs en tiempo real:
  - "Conectando con servidor..."
  - "Escaneando página principal..."
  - "ENCONTRADO: Fisioterapia Deportiva - 50€"
- Checklist:
  - ✓ Conexión establecida
  - ✓ Mapa del sitio escaneado
  - ⏳ Procesamiento de lenguaje natural
  - ⬜ Generación de respuestas

**Backend**: WebSocket envía eventos de progreso
**Duración**: 30-60 segundos (real) o 8 segundos (simulado)
**Navegación Automática**: → `/demo/physiotherapy/preview?sourceId=src-123`

---

### Pantalla 4: Knowledge Preview

**Ruta**: `/demo/physiotherapy/preview?sourceId=src-123`
**Estado**: ❌ **FALTA GENERAR** (tengo el prompt listo)
**Contenido**:

- Banner: "✓ Scraping completado - 12 servicios detectados"
- Card "Servicios Detectados":
  - Fisioterapia Deportiva - 50€ (95% confianza)
  - Masaje Terapéutico - 40€ (87% confianza)
  - Rehabilitación Postural - 45€ (92% confianza)
- Card "Información de Contacto":
  - Teléfono, email, dirección
- Card "Horarios":
  - Lun-Vie: 9:00-20:00
- Stats: "12 páginas • 2 min • 95% confianza"
- Botones:
  - "Volver a Escanear"
  - **"Continuar al Workflow"** ← PRIMARY CTA

**Acción del Usuario**: Click "Continuar al Workflow"
**Navegación**: → `/demo/physiotherapy/workflow?sourceId=src-123`

---

### Pantalla 5: Workflow Builder

**Ruta**: `/demo/physiotherapy/workflow?sourceId=src-123`
**Estado**: ✅ HTML generado
**Contenido**:

- Título: "Agent Workflow"
- Workflow visual (drag & drop):
  - Nodo 1: "User opens chat" (trigger)
  - Nodo 2: "Ask Question" - "¿Cómo puedo ayudarte?"
  - Nodo 3: "Use Body Map" - Seleccionar zona de dolor
  - Nodo 4: "Branch based on selection"
- Componentes disponibles (bottom sheet):
  - Ask Question
  - Provide Service Info
  - Use Body Map
  - Collect Contact Info
- Botones:
  - "Sign Up to Save" (top right)
  - Navegación bottom: Home, **Flows**, Knowledge, Chat

**Acción del Usuario**:

- **Opción A**: Edita el workflow (drag & drop)
- **Opción B**: Usa el workflow sugerido tal cual
- Click en tab "Chat" (bottom nav)

**Navegación**: → `/demo/physiotherapy/chat?sourceId=src-123&workflowId=wf-456`

---

### Pantalla 6: Enhanced Chat (Final)

**Ruta**: `/demo/physiotherapy/chat?sourceId=src-123&workflowId=wf-456`
**Estado**: ❌ **FALTA GENERAR** (necesito crear el prompt)
**Contenido**:

- **Panel Izquierdo (60%)**:

  - Header: "Asistente de [Nombre Clínica]" + "En línea"
  - Chat bubbles:
    - AI: "¡Hola! Soy el asistente de Clínica FisioMadrid. ¿En qué puedo ayudarte?"
    - User: "Tengo dolor de hombro"
    - AI: "Entiendo. ¿Es un dolor agudo o crónico?"
  - Input: "Describe tu dolor..."
  - Botón: Micrófono (voice input)

- **Panel Derecho (40%)**:
  - Tabs: "Mapa Corporal" | "Servicios" | "Información"
  - **Tab 1 - Mapa Corporal**:
    - SVG interactivo del cuerpo humano
    - Zonas clickeables (hombro, espalda, rodilla)
    - Front/Back toggle
  - **Tab 2 - Servicios**:
    - Lista de servicios del knowledge base
    - Fisioterapia Deportiva - 50€
    - Click → Menciona en el chat
  - **Tab 3 - Información**:
    - Horarios, ubicación, contacto

**Interacción**:

- Usuario click en "Hombro" en Body Map
- Chat input se auto-rellena: "Tengo dolor en el hombro"
- Usuario envía
- AI responde basándose en el workflow + knowledge base

**Este es el FINAL del flujo** - Usuario experimenta el producto completo

---

## 🔄 Flujo Alternativo (Datos de Ejemplo)

Si el usuario clickea "Usar datos de ejemplo" en Pantalla 2:

- Salta el scraping real
- Usa datos mock predefinidos
- Resto del flujo es idéntico

---

## 📊 Resumen Visual del Flujo

```
Landing Page
    ↓ Click "Product Demo - Fisioterapia"

1. Niche Selector ✅
    ↓ Click "Salud y Bienestar"

2. URL Input ✅
    ↓ Introduce URL + Click "Escanear"

3. Training Overlay ✅
    ↓ Auto-navega al completar (100%)

4. Knowledge Preview ❌ FALTA
    ↓ Click "Continuar al Workflow"

5. Workflow Builder ✅
    ↓ Click tab "Chat"

6. Enhanced Chat ❌ FALTA
    ↓ Usuario prueba el agente

[FIN - Usuario impresionado]
```

---

## ✅ Lo que Tienes

1. ✅ Niche Selector (HTML)
2. ✅ URL Input (HTML)
3. ✅ Training Overlay (HTML)
4. ✅ Workflow Builder (HTML)

## ❌ Lo que Falta

5. ❌ Knowledge Preview (HTML) - **CRÍTICO**
6. ❌ Enhanced Chat (HTML) - **CRÍTICO**

---

## 🎯 Próxima Acción

**Generar las 2 pantallas que faltan**:

1. **Knowledge Preview** (tengo el prompt listo)

   - Tiempo: 5 minutos en v0.dev
   - Importancia: CRÍTICA (muestra el valor del scraping)

2. **Enhanced Chat** (necesito crear el prompt)
   - Tiempo: 10 minutos en v0.dev
   - Importancia: CRÍTICA (experiencia final del producto)

**Luego**:

- Convertir los 6 HTMLs a Angular components
- Configurar routing
- Conectar con backend

¿Quieres que te dé el prompt para **Enhanced Chat** ahora?

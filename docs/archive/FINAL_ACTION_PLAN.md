# 🎯 Plan Final: Implementación del Flujo de Fisioterapia

## ✅ Decisión Final: ITERAR sobre el código existente

**Razón**: El objetivo final es el mismo (agendar cita + informar), solo cambia cómo llegamos ahí.

---

## 📋 Resumen de lo que Tienes

### Frontend

1. ✅ **4 Pantallas HTML generadas**:

   - Niche Selector
   - URL Input
   - Training Overlay
   - Workflow Builder

2. ❌ **2 Pantallas por generar**:

   - Knowledge Preview (tengo el prompt)
   - Enhanced Chat (necesito crear prompt)

3. ✅ **Componentes reutilizables**:
   - Body Map (en `rider-agent/components/body-map/`)
   - Voice Service (en `core/services/voice.service.ts`)
   - Chat UI (en `rider-agent/components/ai-menu-chat/`)

### Backend

1. ✅ **Funcional**:

   - `POST /api/v1/knowledge/ingest` - Scraping
   - WebSocket `/knowledge` - Progreso
   - Puppeteer funcionando

2. ❌ **Por crear**:
   - `GET /api/v1/knowledge/source/:sourceId` - Obtener datos
   - `POST /api/v1/workflow/generate` - Generar workflow
   - Persistencia en DB (TypeORM)

---

## 🚀 Plan de Acción (Paso a Paso)

### Paso 1: Generar las 2 Pantallas que Faltan (TÚ)

**Tiempo**: 30 minutos
**Herramienta**: v0.dev o Bolt.new

1. **Knowledge Preview**:

   - Usa el prompt de `KNOWLEDGE_PREVIEW_PROMPT.md`
   - Genera el HTML
   - Guarda el código

2. **Enhanced Chat**:
   - Te daré el prompt
   - Genera el HTML
   - Guarda el código

**Resultado**: 6 pantallas HTML completas

---

### Paso 2: Crear Componentes en Booking Module (YO)

**Tiempo**: 2-3 horas
**Acción**: Convertir los 6 HTMLs a componentes Angular

```bash
# Crear componentes
ng generate component booking/components/niche-selector
ng generate component booking/components/url-input
ng generate component booking/components/training-progress
ng generate component booking/components/knowledge-preview
ng generate component booking/components/workflow-builder
# (Enhanced chat ya existe, solo modificar)
```

**Resultado**: Componentes Angular listos

---

### Paso 3: Configurar Routing (YO)

**Tiempo**: 1 hora
**Archivo**: `booking/booking-routing.module.ts`

```typescript
const routes: Routes = [
  { path: "", redirectTo: "select-niche", pathMatch: "full" },
  { path: "select-niche", component: NicheSelectorComponent },
  { path: ":niche/setup", component: UrlInputComponent },
  { path: ":niche/training", component: TrainingProgressComponent },
  { path: ":niche/preview", component: KnowledgePreviewComponent },
  { path: ":niche/workflow", component: WorkflowBuilderComponent },
  { path: ":niche/chat", component: AiMenuChatComponent },
];
```

**Resultado**: Navegación entre pantallas funciona

---

### Paso 4: Conectar con Backend (YO)

**Tiempo**: 2-3 horas
**Acción**: Integrar `KnowledgeService` en los componentes

**Resultado**: Scraping funciona end-to-end

---

### Paso 5: Actualizar Chat (YO)

**Tiempo**: 3-4 horas
**Acción**: Modificar `AiMenuChatComponent` para usar knowledge base

**Resultado**: Chat usa datos reales del scraping

---

## ⏱️ Timeline

### Hoy (Sábado)

- **TÚ**: Generar Knowledge Preview HTML (15 min)
- **TÚ**: Generar Enhanced Chat HTML (15 min)
- **YO**: Crear componentes Angular (2-3 horas)
- **YO**: Configurar routing (1 hora)

**Resultado al final del día**: Navegación básica funciona

---

### Mañana (Domingo)

- **YO**: Conectar con backend (2-3 horas)
- **YO**: Actualizar chat (3-4 horas)
- **YO**: Testing end-to-end (1-2 horas)

**Resultado**: Demo completa funcional

---

### Próxima Semana

- Backend: Persistencia en DB
- Backend: Generación de workflows con IA
- Frontend: Workflow Builder drag & drop
- Polish y optimizaciones

---

## 🎯 Próxima Acción INMEDIATA

**¿Qué quieres hacer ahora?**

### Opción A: Generar las 2 Pantallas que Faltan

- Te doy el prompt para Enhanced Chat
- Generas ambas en v0.dev
- Me pasas los HTMLs
  → Luego yo empiezo con Angular

### Opción B: Yo Empiezo con Angular Ahora

- Creo los componentes con los 4 HTMLs que ya tienes
- Configuro routing básico
- Mientras tanto, tú generas las 2 que faltan
  → Trabajamos en paralelo

### Opción C: Primero Backend

- Creo el endpoint `GET /source/:id`
- Configuro persistencia en DB
- Luego hacemos frontend
  → Backend sólido primero

**Mi recomendación**: **Opción A** - Generas las 2 pantallas (30 min), luego yo hago todo el Angular de una vez.

¿Qué prefieres?

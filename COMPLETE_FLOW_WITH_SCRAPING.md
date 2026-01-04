# Flujo Completo con Scraping (Corregido)

## Secuencia de Pantallas

### 1. Niche Selector

**Ruta**: `/demo/select-niche`
**Acción**: Usuario selecciona categoría (ej: "Salud y Bienestar")
**Navegación**: → `/demo/physiotherapy/setup`

---

### 2. URL Input

**Ruta**: `/demo/physiotherapy/setup`
**Componente**: `UrlInputComponent`
**Acciones**:

- Usuario introduce URL o usa "datos de ejemplo"
- Click en "Escanear Sitio Web"
- **Backend**: `POST /api/v1/knowledge/ingest { url, tenantId }`
- **Respuesta**: `{ sourceId: "src-123", status: "processing" }`
  **Navegación**: → `/demo/physiotherapy/training?sourceId=src-123`

---

### 3. Training Overlay (Scraping en Progreso)

**Ruta**: `/demo/physiotherapy/training?sourceId=src-123`
**Componente**: `TrainingProgressComponent`
**Funcionalidad**:

```typescript
// 1. Conectar WebSocket
socket.on("knowledge.progress", (data) => {
  // { progress: 45, message: "Escaneando página principal..." }
  updateProgress(data);
});

socket.on("knowledge.content_found", (data) => {
  // { type: "service", preview: "Fisioterapia Deportiva - 50€" }
  addLogLine(`ENCONTRADO: ${data.preview}`);
});

socket.on("knowledge.completed", (data) => {
  // { sourceId: "src-123", totalItems: 12 }
  navigate("/demo/physiotherapy/preview?sourceId=src-123");
});
```

**Navegación**: → `/demo/physiotherapy/preview?sourceId=src-123` (cuando completa)

---

### 4. Knowledge Preview (NUEVA - FALTA CREAR)

**Ruta**: `/demo/physiotherapy/preview?sourceId=src-123`
**Componente**: `KnowledgePreviewComponent` (NO EXISTE TODAVÍA)
**Funcionalidad**:

```typescript
// GET /api/v1/knowledge/source/src-123
{
  sourceId: "src-123",
  url: "https://clinica-ejemplo.com",
  services: [
    { name: "Fisioterapia Deportiva", price: "50€", confidence: 0.9 },
    { name: "Masaje Terapéutico", price: "40€", confidence: 0.85 }
  ],
  contact: {
    phone: "+34 123 456 789",
    email: "info@clinica.com",
    address: "Calle Principal 123"
  },
  schedule: {
    monday: "9:00 - 20:00",
    // ...
  }
}
```

**UI**:

- Card "Servicios Detectados" (lista con precios)
- Card "Información de Contacto"
- Card "Horarios"
- Botón "Editar" en cada item (para corregir)
- Botón "Continuar al Workflow Builder"

**Navegación**: → `/demo/physiotherapy/workflow?sourceId=src-123`

---

### 5. Workflow Builder

**Ruta**: `/demo/physiotherapy/workflow?sourceId=src-123`
**Componente**: `WorkflowBuilderComponent`
**Funcionalidad**:

- Usuario arrastra componentes (Body Map, Ask Question, etc.)
- Configura cada nodo con datos del Knowledge Base
- Ejemplo: "Ask Question" → Texto: "¿En qué zona tienes dolor?"
- Ejemplo: "Body Map" → Zonas disponibles: Hombro, Espalda, Rodilla (del scraping)
  **Navegación**: → `/demo/physiotherapy/chat?sourceId=src-123&workflowId=wf-456`

---

### 6. Enhanced Chat

**Ruta**: `/demo/physiotherapy/chat?sourceId=src-123&workflowId=wf-456`
**Componente**: `EnhancedChatComponent`
**Funcionalidad**:

- Chat usa el workflow creado
- Body Map usa datos del Knowledge Base
- Respuestas basadas en servicios/precios escaneados

---

## Backend Endpoints Necesarios

### Existentes ✅

- `POST /api/v1/knowledge/ingest` - Inicia scraping
- WebSocket `/knowledge` - Progreso en tiempo real

### Faltan Crear ❌

- `GET /api/v1/knowledge/source/:sourceId` - Obtener datos escaneados
- `PUT /api/v1/knowledge/source/:sourceId/service/:serviceId` - Editar servicio
- `POST /api/v1/workflow` - Guardar workflow
- `GET /api/v1/workflow/:workflowId` - Obtener workflow

---

## Pantallas HTML que Tienes

1. ✅ **Niche Selector** - Listo para convertir
2. ✅ **URL Input** - Listo para convertir
3. ✅ **Training Overlay** - Listo para convertir
4. ❌ **Knowledge Preview** - FALTA GENERAR (necesitas el prompt)
5. ✅ **Workflow Builder** - Listo para convertir

---

## Próximos Pasos

### Inmediato

1. Generar HTML para **Knowledge Preview** (te doy el prompt)
2. Crear endpoint `GET /api/v1/knowledge/source/:sourceId`
3. Convertir los 5 HTMLs a Angular components

### Corto Plazo

1. Conectar WebSocket real en Training Overlay
2. Implementar edición en Knowledge Preview
3. Guardar workflows en DB

---

## Prompt para Knowledge Preview

¿Quieres que te genere el prompt para crear la pantalla "Knowledge Preview" que falta?
Es la pantalla que muestra:

- Servicios detectados (con precios)
- Información de contacto
- Horarios
- Botones para editar cada item
- Botón "Continuar al Workflow Builder"

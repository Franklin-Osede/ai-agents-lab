# Plan de Integración: HTMLs Generados → Flujo Angular

## Estado Actual

Tienes 4 pantallas HTML generadas con Tailwind CSS:

1. **Niche Selector** - Selección de categoría (Salud, Dental, Belleza, etc.)
2. **URL Input** - Conecta tu Negocio (input para URL)
3. **Training Overlay** - Entrenando tu Agente (progreso)
4. **Workflow Builder** - Crear flow del agente (NUEVA - no estaba en el plan original)

## Estrategia de Integración

### Opción A: Reemplazar Componentes Existentes (Rápido)

**Ventaja**: Ves resultados inmediatos
**Desventaja**: Pierdes la funcionalidad actual

1. Reemplazar `booking/voice-booking` con **Niche Selector**
2. Crear nuevo componente `knowledge/url-input` con **URL Input**
3. Actualizar `knowledge/training-overlay` con **Training Overlay**
4. Crear nuevo `knowledge/workflow-builder` con **Workflow Builder**

### Opción B: Crear DemoFlowModule (Arquitectura Limpia)

**Ventaja**: Mantiene todo separado y escalable
**Desventaja**: Más trabajo inicial

```
demo-flow/
├── niche-selector/
├── url-input/
├── training-progress/
├── workflow-builder/
└── enhanced-chat/
```

## Recomendación: Opción B (DDD/TDD)

### Paso 1: Crear Estructura

```bash
ng generate module demo-flow --route demo --module app.module
ng generate component demo-flow/niche-selector
ng generate component demo-flow/url-input
ng generate component demo-flow/training-progress
ng generate component demo-flow/workflow-builder
```

### Paso 2: Convertir HTML a Angular

Para cada componente:

1. Copiar el HTML (sin `<html>`, `<head>`, `<body>`)
2. Reemplazar clases Tailwind inline por Angular bindings donde sea necesario
3. Agregar lógica TypeScript (Signals, eventos)
4. Conectar con `KnowledgeService`

### Paso 3: Routing

```typescript
// demo-flow-routing.module.ts
const routes: Routes = [
  { path: "", redirectTo: "select-niche", pathMatch: "full" },
  { path: "select-niche", component: NicheSelectorComponent },
  { path: ":niche/setup", component: UrlInputComponent },
  { path: ":niche/training", component: TrainingProgressComponent },
  { path: ":niche/workflow", component: WorkflowBuilderComponent },
  { path: ":niche/chat", component: EnhancedChatComponent },
];
```

### Paso 4: Flujo de Navegación

```
/demo/select-niche
  → Usuario selecciona "Salud y Bienestar"

/demo/physiotherapy/setup
  → Introduce URL o usa datos de ejemplo
  → Click "Escanear Sitio Web"

/demo/physiotherapy/training
  → Muestra progreso del scraping
  → Auto-navega cuando completa

/demo/physiotherapy/workflow (NUEVO)
  → Usuario crea/edita el flow del agente
  → Arrastra componentes (Body Map, Ask Question, etc.)
  → Click "Save" o "Continue to Chat"

/demo/physiotherapy/chat
  → Chat con Body Map integrado
  → Usa el workflow creado
```

## Workflow Builder (Pantalla Nueva)

Esta pantalla es **CRÍTICA** porque permite:

- ✅ Crear flows personalizados sin código
- ✅ Arrastrar componentes (Body Map, preguntas, etc.)
- ✅ Visualizar el flujo completo
- ✅ Editar en tiempo real

**Arquitectura Backend Necesaria**:

```typescript
// workflow.entity.ts
export class Workflow {
  id: string;
  tenantId: string;
  niche: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

export interface WorkflowNode {
  id: string;
  type: "trigger" | "question" | "body-map" | "branch" | "action";
  config: Record<string, unknown>;
  position: { x: number; y: number };
}
```

## Próximos Pasos Inmediatos

### Hoy (2-3 horas)

1. ✅ Crear `DemoFlowModule`
2. ✅ Convertir **Niche Selector** a Angular
3. ✅ Convertir **URL Input** a Angular
4. ✅ Configurar routing básico

### Mañana

1. Convertir **Training Overlay** (actualizar el existente)
2. Crear **Workflow Builder** component
3. Integrar con `KnowledgeService`

### Próxima Semana

1. Backend para Workflow (guardar/cargar flows)
2. Drag & Drop en Workflow Builder
3. Ejecutar workflows en el chat

## Decisión Crítica

**¿Quieres que proceda con la Opción B (DemoFlowModule)?**

Si dices que sí, empiezo ahora mismo a:

1. Crear la estructura de módulos
2. Convertir el primer HTML (Niche Selector) a Angular
3. Configurar el routing

**¿O prefieres que primero actualice los componentes existentes de Knowledge con estos nuevos diseños?**

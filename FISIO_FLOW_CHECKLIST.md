# Checklist Completo: Flujo de Fisioterapia

## 📱 FRONTEND - Pantallas

### ✅ Tienes (HTML Generado)

1. ✅ **Niche Selector** - Selección de categoría
2. ✅ **URL Input** - Conecta tu negocio
3. ✅ **Training Overlay** - Progreso del scraping
4. ✅ **Workflow Builder** - Crear flow del agente

### ❌ Faltan Generar

5. ❌ **Knowledge Preview** - Mostrar lo escaneado

   - **Acción**: Generar con el prompt que te di
   - **Tiempo**: 5 minutos en v0.dev

6. ❌ **Enhanced Chat** - Chat + Body Map integrado
   - **Acción**: Necesitas prompt para esta pantalla
   - **Tiempo**: 10 minutos en v0.dev

---

## 🔧 FRONTEND - Integración Angular

### ❌ Todo por Hacer

1. ❌ Crear `DemoFlowModule`
2. ❌ Convertir 6 HTMLs a componentes Angular
3. ❌ Configurar routing
4. ❌ Conectar con `KnowledgeService`
5. ❌ Integrar WebSocket real

**Tiempo estimado**: 1-2 días

---

## 🖥️ BACKEND - APIs

### ✅ Tienes

1. ✅ `POST /api/v1/knowledge/ingest` - Inicia scraping
2. ✅ WebSocket `/knowledge` - Progreso en tiempo real
3. ✅ `PuppeteerScraperAdapter` - Scraping funcional
4. ✅ `ContentClassifierService` - Clasificación básica

### ❌ Faltan Crear

5. ❌ `GET /api/v1/knowledge/source/:sourceId` - Obtener datos escaneados

   - **Retorna**: Servicios, precios, contacto, horarios
   - **Necesario para**: Knowledge Preview

6. ❌ `PUT /api/v1/knowledge/source/:sourceId` - Editar datos

   - **Permite**: Corregir servicios, precios, etc.
   - **Necesario para**: Knowledge Preview (botón editar)

7. ❌ `POST /api/v1/workflow/generate` - Generar workflow automático

   - **Input**: sourceId, niche
   - **Output**: Workflow JSON con nodos
   - **Necesario para**: Workflow Builder

8. ❌ `POST /api/v1/workflow` - Guardar workflow

   - **Input**: Workflow JSON
   - **Output**: workflowId
   - **Necesario para**: Workflow Builder (botón save)

9. ❌ `GET /api/v1/workflow/:workflowId` - Obtener workflow
   - **Necesario para**: Chat (ejecutar el workflow)

**Tiempo estimado**: 2-3 días

---

## 🗄️ BACKEND - Base de Datos

### ❌ Todo por Hacer

1. ❌ Tabla `knowledge_sources` (TypeORM entity)

   - Campos: id, url, tenantId, status, metadata, createdAt

2. ❌ Tabla `knowledge_chunks` (TypeORM entity)

   - Campos: id, sourceId, content, type, embedding (vector)

3. ❌ Tabla `workflows` (TypeORM entity)

   - Campos: id, sourceId, tenantId, nodes (JSON), createdAt

4. ❌ Configurar pgvector para embeddings
   - **Necesario para**: Búsqueda semántica en el chat

**Tiempo estimado**: 1 día

---

## 🤖 BACKEND - IA Features

### ❌ Faltan Implementar

1. ❌ **Generación de Embeddings**

   - Usar OpenAI Embeddings API
   - Guardar en `knowledge_chunks.embedding`

2. ❌ **Búsqueda Semántica**

   - Query: "dolor de hombro"
   - Buscar chunks similares con pgvector
   - Retornar contexto relevante

3. ❌ **Generación de Workflows**

   - Template base por nicho
   - IA personaliza textos (GPT-4)
   - Retorna workflow JSON

4. ❌ **Chat con RAG**
   - Usuario pregunta algo
   - Buscar contexto en knowledge base
   - Generar respuesta con GPT-4 + contexto

**Tiempo estimado**: 3-4 días

---

## 🎨 COMPONENTES ESPECÍFICOS

### ❌ Body Map Component

- **Estado**: Ya existe pero necesita integración
- **Acción**: Conectar con workflow y knowledge base
- **Tiempo**: 1 día

### ❌ Voice Integration

- **Estado**: Existe en booking module
- **Acción**: Adaptar para fisioterapia
- **Tiempo**: 1 día

---

## 📊 RESUMEN POR PRIORIDAD

### 🔥 CRÍTICO (Para Demo Funcional)

1. ❌ Generar **Knowledge Preview** HTML
2. ❌ Generar **Enhanced Chat** HTML
3. ❌ Crear `DemoFlowModule` en Angular
4. ❌ Convertir 6 HTMLs a Angular components
5. ❌ Backend: `GET /api/v1/knowledge/source/:sourceId`
6. ❌ Backend: Persistir datos en DB (TypeORM)

**Tiempo**: 3-4 días
**Resultado**: Demo end-to-end funcional

---

### ⚡ IMPORTANTE (Para Producto Usable)

7. ❌ Backend: `POST /api/v1/workflow/generate`
8. ❌ Backend: Guardar/cargar workflows
9. ❌ Frontend: Workflow Builder funcional (drag & drop)
10. ❌ Integrar Body Map con workflow

**Tiempo**: 4-5 días
**Resultado**: Producto usable sin IA avanzada

---

### 🚀 AVANZADO (Para Producto Premium)

11. ❌ Embeddings + pgvector
12. ❌ Búsqueda semántica
13. ❌ Chat con RAG (GPT-4 + contexto)
14. ❌ Generación automática de workflows con IA
15. ❌ Voice integration

**Tiempo**: 1-2 semanas
**Resultado**: Producto premium con IA real

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Semana 1: Demo Funcional

**Día 1-2**:

- Generar Knowledge Preview HTML
- Generar Enhanced Chat HTML
- Crear DemoFlowModule

**Día 3-4**:

- Convertir HTMLs a Angular
- Configurar routing
- Backend: GET /source/:id

**Día 5**:

- Persistir en DB
- Testing end-to-end

**Resultado**: Demo completa que puedes mostrar

---

### Semana 2: Workflows

**Día 1-2**:

- Backend: Generar workflows (template + IA básica)
- Backend: Guardar/cargar workflows

**Día 3-4**:

- Frontend: Workflow Builder drag & drop
- Integrar Body Map

**Día 5**:

- Testing y refinamiento

**Resultado**: Producto usable

---

### Semana 3-4: IA Avanzada

- Embeddings
- RAG
- Voice
- Optimizaciones

**Resultado**: Producto premium

---

## ❓ DECISIÓN INMEDIATA

**¿Qué quieres hacer primero?**

**Opción A: Generar las 2 pantallas que faltan** (30 min)

- Knowledge Preview
- Enhanced Chat
  → Luego empezamos con Angular

**Opción B: Empezar con Backend** (hoy)

- Crear endpoint GET /source/:id
- Persistir en DB
  → Mientras generas las pantallas

**Opción C: Empezar con Angular** (hoy)

- Crear DemoFlowModule
- Convertir primera pantalla (Niche Selector)
  → Ir pantalla por pantalla

**Mi recomendación**: **Opción A** → Genera las 2 pantallas que faltan primero (30 min), luego hacemos **Opción C** (Angular) mientras el backend sigue funcionando con los mocks actuales.

¿Qué prefieres?

# Plan Maestro de Implementación: AI Knowledge Platform (TDD & DDD)

Este documento es la **Fuente de Verdad Técnica**. Define cómo transformar el proyecto actual en una plataforma RAG escalable, respetando estrictamente Clean Architecture y TDD.

---

## 1. Estado Actual (Análisis)

### Lo que tenemos

- **Estructura**: Modular Monolith en NestJS (`backend/src/agents/...`).
- **Frontend**: Angular con Signals y Arquitectura basada en Componentes.
- **Calidad**: Setup base correcto, pero falta estandarización de pruebas automáticas para nuevas features.

### El Gap (Lo que falta)

- No existe el **Bounded Context de Conocimiento** (`KnowledgeContext`).
- Los agentes actuales (`RiderAgent`, `BookingAgent`) son "tontos" (usan hardcoded logic o scripts fijos).
- No hay infraestructura de Vector Store (pgvector) configurada.

---

## 2. Arquitectura de Referencia (Strict DDD)

Crearemos un nuevo módulo raíz: `backend/src/knowledge`.
Este módulo DEBE ser independiente de los agentes. Los agentes dependen de él, no al revés.

### Estructura de Carpetas (Mandatory)

```
src/knowledge/
├── domain/                  # PURE TS. No NestJS dependencies.
│   ├── entities/            # KnowledgeSource, KnowledgeChunk
│   ├── events/              # KnowledgeIngestedEvent
│   ├── repositories/        # IVectorRepository (Interface)
│   └── services/            # ScrapingService (Interface)
├── application/             # Use Cases.
│   ├── dto/                 # IngestWebDto, QueryKnowledgeDto
│   └── use-cases/           # IngestWebsiteUseCase, SearchContextUseCase
├── infrastructure/          # Implementations.
│   ├── persistence/         # TypeORM/PgVector entities & repos
│   ├── scraping/            # PuppeteerAdapter implements ScrapingService
│   └── vectors/             # OpenAIEmbeddingsAdapter
└── presentation/            # Controllers.
    └── knowledge.controller.ts
```

---

## 3. Estrategia TDD (Test-Driven Development)

**REGLA DE ORO**: No se escribe una línea de código de producción sin un test que falle primero.

### El Ciclo de Desarrollo (Red-Green-Refactor)

1.  **RED**: Escribir `ingest-website.use-case.spec.ts`.
    - Mockear `IScraperService` y `IVectorRepository`.
    - Definir que el input es una URL y el output esperado es un ID de trabajo.
2.  **GREEN**: Implementar la clase `IngestWebsiteUseCase` mínima para pasar el test.
3.  **REFACTOR**: Limpiar código.
4.  **INTEGRATION**: Escribir test e2e (`knowledge.e2e-spec.ts`) que levante un contenedor de Postgres (o mockeado) y verifique el flujo completo.

---

## 4. Fases de Implementación (Roadmap Técnico)

### Fase 1: Core de Conocimiento (Backend)

**Objetivo**: Poder enviar una URL y que se guarde vectorizada.

- [ ] **Setup Infra**: Configurar TypeORM con `pgvector`.
- [ ] **Dominio**: Definir entidad `KnowledgeSource` (id, url, status, chunks).
- [ ] **Scraper**: Implementar `PuppeteerAdapter` (extraer texto plano de URL).
- [ ] **Vector Store**: Implementar `PgVectorRepository` (guardar embeddings).
- [ ] **Use Case**: `IngestWebsiteUseCase`.

### Fase 2: Orquestación y "Non-Blocking UI" (Backend/API)

**Objetivo**: Gestionar la asincronía.

- [ ] **Eventos**: Implementar `KnowledgeIngestedEvent`.
- [ ] **WebSockets**: Crear Gateway `KnowledgeEventsGateway` para emitir `progress`.
- [ ] **Queue (In-Memory)**: Configurar `p-queue` para procesar URLs en background.

### Fase 3: Integración con Agentes (Backend)

**Objetivo**: Que el agente responda dudas usando esa info.

- [ ] **Servicio**: `ContextRetrieverService` (Buscar chunks relevantes por query).
- [ ] **Tooling**: Crear una Tool de LangChain/Custom llamada `AskKnowledgeBase`.
- [ ] **Agente Fisio**: Inyectar esta tool en el prompt del sistema.

### Fase 4: Experiencia Visual (Frontend)

**Objetivo**: El "Wow Effect".

- [ ] **Visual**: Componente `KnowledgeTrainingCard` (la "terminal hacker" que muestra el progreso).
- [ ] **Body Map**: Componente SVG interactivo.
- [ ] **Conexión**: Conectar los eventos WebSocket a Signals de Angular.

---

## 5. Próximos Pasos (Inmediatos)

Para empezar con buen pie (TDD + Best Practices):

1.  Crear la estructura de carpetas `src/knowledge/...`.
2.  Instalar dependencias clave: `puppeteer`, `langchain` (si no está), `pgvector` (en DB).
3.  **Primer Test**: Crear `src/knowledge/domain/services/content-classifier.service.spec.ts`.
    - _¿Por qué este?_ Porque es el corazón de la inteligencia ("El Bibliotecario IA"). Vamos a testear primero que sabemos clasificar texto antes de meternos en scraping complejo.

¿Procedemos a crear la estructura del módulo `knowledge`?

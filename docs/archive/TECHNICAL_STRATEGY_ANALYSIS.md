# Análisis Técnico y Estratégico: Scalable Agent Platform

Este documento evalúa la viabilidad técnica, la arquitectura DDD y la estrategia de implementación para la plataforma de agentes con capacidades RAG y UX específica por nicho.

## 1. El Dilema de Instagram (Scraping vs. Realidad)

**¿Es buena idea?** Funcionalmente, sí. Sería increíble decir: _"Veo en tu último post que hablas de Invisalign"_ y mandar ese post.

**¿Es viable "gratis" y "simple"?** **NO.**

- **Anti-Scraping Agresivo**: Meta (Facebook/Instagram) tiene los sistemas anti-bot más sofisticados del mundo. Un scraper casero (Puppeteer/Selenium) será bloqueado en horas (IP ban).
- **Overengineering Alert**: Mantener un scraper de IG funcional requiere proxies rotatorios residenciales (caros) y mantenimiento constante de selectores CSS ofuscados.
- **Alternativa Legal**: La API oficial de Instagram (Graph API). Requiere que el cliente (el negocio) haga "Login con Facebook" en tu app. Es viable, robusto y gratis, pero añade fricción de onboarding.

**Veredicto**: **Postponer para Fase 3**. Viola el principio KISS en la etapa actual. Céntrate primero en la Web (Open Web) que es fácil de leer.

---

## 2. Arquitectura DDD & Clean Code (Cómo no morir de éxito)

Para mantener el código mantenible y no crear un "monstruo de espagueti", separaremos responsabilidades estrictamente.

### Bounded Context: `KnowledgeContext`

Este contexto se encarga SOLO de adquirir y servir información. No sabe nada de chats ni de usuarios.

**Domain Layer (El Corazón):**

- **Entities**:
  - `KnowledgeSource`: Representa una fuente (URL web, PDF, Texto Manual).
  - `KnowledgeChunk`: Un fragmento de información vectorizada.
- **Aggregates**: `BusinessKnowledge` (Agrupa todas las fuentes de un tenant).
- **Interfaces (Ports)**:
  - `IContentScraper`: Contrato para obtener texto (implementación: Puppeteer).
  - `IVectorStore`: Contrato para guardar vectores (implementación: pgvector).

**Application Layer (Casos de Uso):**

- `IngestWebsiteUseCase`: Recibe URL -> Llama Scraper -> Limpia -> Vectoriza -> Guarda.
- `FindRelevantContextUseCase`: Recibe Query -> Busca Vectores -> Devuelve Texto.

**Infrastructure Layer (Detalles Sucios):**

- `PuppeteerAdapter`: La implementación real que abre Chrome y lee HTML.
- `OpenAIEmbeddingsAdapter`: Convierte texto a números.
- `PostgresVectorRepository`: Guarda los arrays de números.

### Bounded Context: `ConversationContext` (Tus Agentes actuales)

Tus agentes (`RiderAgent`, `PhysioAgent`) viven aquí.

- Cuando necesitan info, **consultan** al `KnowledgeContext` a través de un servicio inyectado (`ContextRetrieverService`).
- **Decoupling**: El agente no sabe si la info vino de Instagram o de la Web. Solo recibe "Contexto relevante".

---

## 3. Estrategia de Implementación por Fases

Esta hoja de ruta minimiza riesgos y valida valor rápidamente.

### Fase 1: El Cerebro Base (RAG Web Simple)

_Objetivo_: Que el agente responda preguntas básicas del negocio (precios, horarios).

- **Tech**: Node.js + Cheerio (Scraping ligero HTML) + pgvector.
- **Funcionalidad**: Input URL -> Chatbot sabe lo básico.
- **Dificultad**: Media.
- **Wow Factor**: Alto (para el dueño del negocio).

### Fase 2: El Cuerpo (Unique UX Hooks)

_Objetivo_: Diferenciar visualmente cada nicho.

- **Fisio**: Implementar el SVG `BodyMap` clickable.
- **Restaurante**: Configurar la "Simulación Restringida" basada en horarios leídos en Fase 1.
- **Dificultad**: Media-Alta (Requiere mucho frontend fino).
- **Wow Factor**: Muy Alto (para el usuario final).

### Fase 3: Fuentes Complejas (PDFs & Multimedia)

_Objetivo_: Profundidad técnica.

- **Tech**: Librerías de PDF parsing, detección de iframes de YouTube.
- **Funcionalidad**: Drag & Drop documentos legales (Fiscal agent). Reproductor de vídeo integrado (Cosmetic agent).
- **Dificultad**: Alta.

---

## 4. Evaluación de Riesgos y Puntos Clave

| Riesgo                       | Impacto                         | Mitigación                                                                               |
| :--------------------------- | :------------------------------ | :--------------------------------------------------------------------------------------- |
| **"Alucinaciones" del LLM**  | Crítico (Inventar precios)      | Usar "Strict Context Prompts" (_"Responde SOLO con esta info. Si no sabes, di no sé"_).  |
| **Cambios en Web Cliente**   | Medio (Info desactualizada)     | Botón manual "Re-entrenar" en el dashboard del cliente. Cronjob semanal.                 |
| **Webs SPA (React/Angular)** | Medio (Scrapers simples fallan) | Usar Puppeteer (Headless Chrome) en lugar de Cheerio, aunque consuma más RAM.            |
| **Costes API OpenAI**        | Bajo/Medio                      | Cachear respuestas frecuentes. Usar modelos "mini" (gpt-4o-mini) para tareas rutinarias. |

## 5. Conclusión para ser "Impecable"

Para que la ejecución sea perfecta, respeta estas reglas:

1.  **Fail Gracefully**: Si el scraper falla en la web del cliente (tiene web firewall, etc.), el sistema no debe explotar. Debe permitir entrada manual de datos ("Sube tu menú en PDF").
2.  **Transparencia**: El agente siempre debe citar la fuente si es posible (_"Según vuestra web, el precio es..."_). Genera confianza.
3.  **Separación de Poderes**: Mantén la lógica visual (BodyMap) totalmente separada de la lógica de negocio (Diagnóstico). Un cambio en el SVG no debe romper el backend.

Recomendación: Empieza con la **Fase 1 (RAG Web)** + **BodyMap (Frontend Fisio)**. Es la combinación ganadora de bajo riesgo y alto impacto visual. Dejemos Instagram para cuando tengas usuarios pagando.

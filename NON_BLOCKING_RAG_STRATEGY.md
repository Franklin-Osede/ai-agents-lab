# Estrategia RAG No Bloqueante y Eficiente (KISS Principle)

Este documento define la arquitectura técnica para eliminar los tiempos de espera del usuario y gestionar el aprendizaje en segundo plano.

## 1. El Problema de la Latencia

- **Situación**: Leer una web completa tarda >30s.
- **Restricción de Negocio**: El usuario abandona si espera >5s.
- **Solución**: Arquitectura de Ingesta Incremental (Streaming Ingestion).

---

## 2. Flujo de Usuario Optimizado ("Start Fast, Learn Later")

1.  **Input**: Usuario introduce `clinica-ejemplo.com`.
2.  **Fase Síncrona (Bloqueante - Max 3s)**:
    - El scraper visita SOLO la raíz (`/`).
    - Extrae: Nombre del negocio, Teléfono, Título principal.
    - **UI**: El chat se habilita inmediatamente. _"¡Hola! Veo que esto es 'Clínica Ejemplo'. ¿En qué puedo ayudarte mientras termino de leer vuestros servicios?"_
3.  **Fase Asíncrona (Background - 30-60s)**:
    - El sistema pone en cola el resto de enlaces (`/servicios`, `/equipo`, `/blog`).
    - Las procesa una a una sin afectar al chat.
    - **Inyección de Contexto en Tiempo Real**:
      - Cada vez que se procesa una página, se añade al Vector Store.
      - El contexto del agente se actualiza "en vivo".
      - _Efecto_: Si preguntas por "precios" al segundo 10, quizás no lo sabe. Si preguntas al segundo 20, ya lo sabe.

---

## 3. Arquitectura Técnica (NestJS + DDD)

Para mantenerlo simple (KISS) y sólido, no usaremos microservicios complejos. Usaremos un **Modular Monolith**.

### Módulo `KnowledgeModule`

#### A. Domain Layer

- **Events**: Usaremos Domain Events para desacoplar.
  - `UrlSubmittedEvent`: Dispara la ingesta rápida.
  - `HomePageProcessedEvent`: Habilita el chat.
  - `DeepPageProcessedEvent`: Notifica "nuevo conocimiento adquirido".

#### B. Infrastructure (Cola Simple)

En lugar de Redis/RabbitMQ (overengineering para <1000 usuarios), usaremos **BullMQ (con Redis local)** o simplemente **P-Queue (In-Memory)**.
_Recomendación inicial_: `p-queue` (librería de Node). Es memoria RAM, si se reinicia el server se pierde la cola, pero para una demo es irrelevante y ahorra costes de infraestructura.

#### C. Scraping Strategy (Crawler)

- Usaremos `Puppeteer` con `puppeteer-extra-plugin-stealth` para evitar bloqueos básicos.
- **Profundidad Limitada**: Configuraremos `maxDepth: 2` para que no intente leer todo internet, solo la web del cliente.
- **Concurrency**: 2 páginas simultáneas para no tumbar la web del cliente ni saturar tu servidor.

---

## 4. Gestión de Voz (Polly)

- La voz debe ser interrumpible.
- Si el agente descubre algo nuevo e importante mientras habla, NO debe interrumpirse a sí mismo.
- Estrategia: "Encolar pensamiento". Si descubre info relevante, espera a que el usuario hable de nuevo para soltarla: _"Por cierto, ahora que lo mencionas, acabo de leer en vuestra web que..."_.

---

## 5. Implementación Paso a Paso

1.  **Backend (Core)**:
    - Crear `KnowledgeModule`.
    - Implementar servicio `ScraperService` (Puppeteer).
    - Implementar `VectorService` (pgvector).
2.  **Orquestación**:
    - Crear el flujo "Home First, Deep Later".
3.  **Frontend**:
    - Adaptar el chat para recibir eventos de `knowledge_updated` vía Socket.io y mostrar notificaciones no intrusivas.

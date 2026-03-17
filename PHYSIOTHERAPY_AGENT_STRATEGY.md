# Estrategia Agente Fisioterapia & Arquitectura RAG

## 1. Visión General

El objetivo es transformar el chatbot estándar en una herramienta de **triaje interactivo**. El usuario no solo "chatea", sino que interactúa con un modelo visual de su dolor. Además, el sistema se respalda en datos reales del negocio (Web Scraping/RAG) para dar respuestas comerciales precisas, y en datos científicos para dar autoridad.

---

## 2. Componente "Body Map" (Frontend)

Para evitar dependencias 3D pesadas (como Three.js) que ralentizan la carga, usaremos un **SVG Interactivo Inteligente**.

### Estructura Técnica

- **Componente**: `BodyMapSelectorComponent`
- **Tecnología**: SVG inline con `paths` definidos por grupos musculares.
- **Interacción**:
  - `Hover`: Ilumina el grupo muscular (ej. Deltoides).
  - `Click`: Emite evento `PartSelectedEvent { id: 'shoulder_right', zone: 'upper_body' }`.
- **Integración con Chat**:
  - El componente se renderiza _dentro_ del flujo del chat como un "mensaje del sistema".
  - Al hacer click, se envía automáticamente un mensaje oculto al agente: _"El usuario señala dolor en hombro derecho"_.

### Flujo de Usuario

1. **Inicio**: "Hola, soy el asistente virtual de FisioClinic. ¿Dónde te duele hoy?"
2. **Visual**: Aparece el mapa corporal.
3. **Selección**: Usuario toca la zona lumbar.
4. **Respuesta Agente**: "Entendido, la zona lumbar. ¿Es un dolor que baja por la pierna (tipo ciática) o se queda concentrado en la espalda baja?"

---

## 3. Arquitectura RAG (Retrieval Augmented Generation)

### Concepto Híbrido

El agente tendrá dos "cerebros":

1.  **Cerebro de Negocio (Local)**: Datos extraídos de la URL del cliente.
    - _Precios, Horarios, Nombres de Doctores, Lista de Tratamientos._
2.  **Cerebro Clínico (Global)**: Base de conocimientos pre-entrenada o conectada a fuentes fiables.
    - _Explicaciones de patologías, beneficios de tratamientos, tiempos de recuperación estándar._

### Pipeline de Datos (Backend)

1.  **Ingesta**: Endpoint `/api/v1/knowledge/ingest-url`.
    - Input: `https://mi-clinica.com`
    - Process: Puppeteer/Cheerio escanea la web -> Limpia HTML -> Convierte a Markdown.
2.  **Chunking & Embedding**:
    - Divide el texto en trozos lógicos (ej. por servicios).
    - Genera embeddings (OpenAI `text-embedding-3-small` es rápido y barato).
    - Guarda en **pgvector** (ya que usamos PostgreSQL/TypeORM).
3.  **Inferencia**:
    - Usuario pregunta.
    - Búsqueda de similitud en vectores.
    - Prompt al LLM: _"Usa el siguiente contexto (WEB CLIENTE) para responder. Si no está ahí, usa tu conocimiento general pero avisa que es información genérica."_

---

## 4. Ideas Futuras: Cosmetic Surgery Agent

### Diferenciadores Clave

- **Simulador de Resultados (Texto)**: "Si busco una nariz más respingona, ¿qué técnica se usa?" -> RAG busca "Rinoplastia Ultrasónica".
- **Calculadora de Downtime**: Un widget interactivo donde el usuario pone su fecha disponible (ej. Vacaciones en Agosto) y el agente calcula si estará recuperado para entonces basándose en los tiempos post-operatorios extraídos de la web.

---

## 5. Implementación Inmediata (Fisioterapia)

1.  Crear módulo `PhysioAgentModule`.
2.  Diseñar/Importar SVG del cuerpo humano estratificado (Músculos/Articulaciones).
3.  Conectar evento de click al servicio de chat.

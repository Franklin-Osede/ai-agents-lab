# Visión Estratégica: Plataforma de Agentes por Nicho

Este documento recoge el análisis estratégico para escalar la plataforma `AI Agents Lab` hacia múltiples verticales, diferenciando el **Core Común (RAG)** de la **Experiencia Específica (UX/Features)**.

## 1. El "Core" Universal: RAG (Retrieval-Augmented Generation)

La base tecnológica es idéntica para todos: **"Tu web es el cerebro del agente"**.

- **Input**: URL del negocio (clínica, despacho, restaurante).
- **Proceso**:
  1.  **Scraping Inteligente**: Extraer servicios, precios, filosofía, equipo, FAQs.
  2.  **Vectorización**: Convertir texto a "conceptos".
  3.  **Consulta**: El agente revisa esta info antes de responder.

> **Valor**: El onboarding del cliente pasa de semanas (programar respuestas a mano) a minutos.

---

## 2. Diferenciación por Nicho (La "Capa de Experiencia")

Para que el producto no sea un "chatbot genérico", cada nicho tiene un "Superpoder" visual o funcional.

### A. Fisioterapia & Salud Física

- **El Gancho (Visual)**: **Body Map Interactivo**.
  - Evita preguntas abiertas ("¿Qué te pasa?").
  - Gamifica la entrada ("Toca dónde duele").
- **Estrategia RAG**:
  - Busca correlaciones entre "Zona de dolor" (input usuario) y "Tratamientos" (web cliente).
  - _Ejemplo_: Usuario toca "Gemelo". Agente lee en la web "Masaje deportivo". -> _"Para esa sobrecarga en el gemelo, veo que ofrecéis masaje de descarga."_

### B. Cirugía Cosmética / Estética

- **El Gancho (Visual)**: **Galería Interactiva & Vídeo**.
  - **Explicación de Productos**: El sector está lleno de términos confusos ("Ácido Hialurónico", "Botox", "Hilos tensores"). RAG es perfecto aquí: traduce "lenguaje médico complejo" a "beneficio simple".
  - **Vídeos Embed**:
    - **Técnica**: Durante el scraping, detectar iframes de YouTube/Vimeo. Asociarlos a servicios (tags).
    - **UX**: Si el usuario pregunta por "Rinoplastia", el chat no solo responde texto, sino que despliega el widget de vídeo: _"Aquí puedes ver al Dr. explicando el procedimiento"_.
- **Packs/Visuales**: Carruseles de "Antes/Después" (anonimizados o genéricos) extraídos de su web si existen.

### C. Fiscal / Legal

- **El Gancho (Funcional)**: **Analista de Documentos**.
  - Aquí la interacción visual importa menos; importa la **precisión** y el **análisis**.
  - **Feature "File Reader"**: Permitir al usuario subir un PDF (ej. una notificación de Hacienda).
  - **Flujo**:
    1.  Usuario sube PDF.
    2.  Agente lo lee (OCR/extracción texto).
    3.  Agente cruza esa info con su conocimiento RAG (leyes cargadas + web del despacho).
    4.  Respuesta: _"He leído tu notificación. Es un requerimiento estándar de IVA. Según los servicios del despacho, podemos gestionarlo con el pack 'Defensa Fiscal'."_

### D. Restaurantes (Rider Agent)

- **El Gancho (Transaccional)**: **Pedido Flúido**.
- **Estrategia RAG**:
  - **Menú Parsing**: Extraer platos de la web/PDF del restaurante es clave.
  - **Horarios**: Extraer "Lunes Cerrado" es vital para la simulación.
- **Disponibilidad (La Simulación Inteligente)**:
  - _Problema_: No tenemos CRM real.
  - _Solución_: **Simulación con Restricciones (Constraint-based Mocking)**.
  - El sistema de reservas NO mira un Google Calendar real, PERO sí respeta las reglas extraídas por RAG:
    - Si la web dice "Abierto solo cenas", la simulación genera huecos solo de 20:00 a 23:00.
    - Esto hace que la demo parezca real y "conectada", aunque sea simulada internamente.

---

## 3. Hoja de Ruta Técnica

1.  **Consolidar Arquitectura RAG (Backend)**:

    - Crear servicio de `WebScraperService`.
    - Integrar `LangChain` + `PostgreSQL (pgvector)` para almacenar conocimiento por `tenant_id`.

2.  **Desarrollar Componentes Visuales (Frontend)**:

    - `BodyMap` (Fisio).
    - `VideoPlayerWidget` (Cosmética).
    - `DocumentUploader` (Fiscal).

3.  **Refinar Simulaciones**:
    - Actualizar `AvailabilityService` para aceptar "Opening Hours" como configuración, permitiendo simulaciones coherentes con cada negocio.

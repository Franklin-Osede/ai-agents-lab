# Estrategia RAG No Bloqueante y UX "Progressive Disclosure"

Este documento define la arquitectura técnica y de experiencia de usuario (UX) para gestionar los tiempos de espera del scraping/análisis mediante una interfaz visual progresiva.

## 1. El Problema de la Percepción

- **Situación**: El análisis profundo con IA tarda >15s.
- **Feedback**: "Pantalla de terminal geek" no amigable y tiempo de espera bloqueante.
- **Solución**: **Progressive Disclosure UI** (Revelación Progresiva).

## 2. Nueva UX: Visual Dashboard vs Terminal

En lugar de mostrar logs de texto (`Started scraping...`), mostraremos una **interfaz gráfica reactiva**.

### Fase 1: Skeleton & Branding Inmediato (<2s)

- Al pulsar "Escanear", la UI transiciona inmediatamente a la vista de "Preview".
- Se muestra un **Skeleton Loader** (esqueleto gris) de la tarjeta de negocio.
- **Feedback Visual**:
  - Si detectamos el color primario rápido, la UI cambia de color suavemente (Efecto Camaleón).
  - Si detectamos el logo, aparece en la cabecera.
  - _Mensaje amigable_: "Conectando con tu sitio web..." en lugar de "Initializing TCP socket...".

### Fase 2: Streaming de Datos (<10s)

- A medida que `Puppeteer` y `Bedrock` extraen datos, se "rellenan" los huecos del skeleton.
  - Primero: Información básica (Nombre, Dirección).
  - Segundo: Servicios (Lista aparece).
  - Tercero: Secciones complejas (Análisis AI).
- **Animaciones**: Usar `fade-in` suave para cada nuevo elemento descubierto.
- **Barra de Progreso Inteligente**: No una barra falsa. Una lista de checks visuales:
  - [x] Conexión establecida
  - [x] Estructura visual analizada
  - [O] Leyendo servicios...

## 3. Arquitectura Técnica (Event-Driven)

Para soportar esta UX, el backend no puede esperar a terminar todo para responder (`await analyze()`). Debe ser **Asíncrono**.

1.  **Frontend**: Abre conexión WebSocket (`socket.io`).
2.  **Backend (`IngestWebsiteUseCase`)**:
    - Lanza el proceso y devuelve `202 Accepted` inmediatamente.
    - **Paso 1 (Scraping Visual)**: Extrae Screenshot/Logo/Color. -> `emit('branding_found', data)`
    - **Paso 2 (Text Extraction)**: Extrae texto plano.
    - **Paso 3 (AI Analysis)**: Llama a Bedrock.
    - **Paso 4 (Completion)**: -> `emit('analysis_complete', fullData)`
3.  **Frontend**: Escucha eventos y actualiza el Store (`KnowledgeState`).

## 4. Beneficios

- **Percepción de Velocidad**: El usuario ve "movimiento" desde el segundo 1.
- **Cero "Geek Factor"**: Sin terminales, sin logs. Solo tu marca construyéndose ante tus ojos.
- **Robustez**: Si la AI falla al 90%, el usuario al menos ve el 90% anterior (logo, screenshot, textos básicos) en lugar de un error 500.

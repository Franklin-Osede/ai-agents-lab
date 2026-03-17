# Flujo UX de la Demo: "El Momento WoW"

Este documento define la experiencia de usuario (UX) para gestionar la naturaleza asíncrona del proceso de escaneo (RAG) sin perder la atención del usuario.

## 1. El Reto: La Espera Asíncrona

El scraping y vectorización no son instantáneos (tardan entre 10-40 segundos según la web).
**Solución**: Convertir la espera en parte del espectáculo ("Building in Public" UI).

---

## 2. Paso a Paso: El Flujo de la Demo

### Fase 1: Selección y Reto

1.  **Usuario**: En la Landing, selecciona la carta **"Salud y Fisioterapia"**.
2.  **Agente (Voz/Texto)**: _"Hola. Soy un especialista en triaje de fisioterapia. Ahora mismo mi cerebro está en blanco. ¿Quieres entrenarme con los datos de tu clínica? Escribe la URL de tu web."_
3.  **UI**: Aparece un input flotante específico para URLs.

### Fase 2: El "Escáner en Vivo" (Gestión del Async)

4.  **Usuario**: Escribe `https://fisio-ejemplo.com` y envía.
5.  **UI (El "Truco")**:
    - El chat NO se queda pensando.
    - Se despliega una **Tarjeta de Progreso interactiva** dentro del chat.
    - **WebSocket Real-time**: El backend envía eventos de lo que está encontrando.
    - **Feedback Visual**:
      - `[✓] Conectando con servidor...`
      - `[✓] Página principal leída.`
      - `[🔍] Detectado servicio: "Osteopatía" - 50€` (¡El usuario ve que es real!)
      - `[🔍] Detectado servicio: "Pilates Máquina"`
      - `[✓] Generando base de conocimiento...`

> **Clave**: Al mostrar los servicios _mientras_ se escanean, el usuario valida mentalmente: "¡Ostras, de verdad lo está leyendo!".

### Fase 3: Confirmación y Transición

6.  **Agente**: _"¡Entrenamiento completado! He aprendido 12 servicios y vuestros horarios. Ahora soy un experto en tu clínica."_
    - _"Pruébame: Señala una zona de dolor en el mapa o pregúntame por precios."_
7.  **UI**: Desaparece la tarjeta de carga y **aparece el BODY MAP (SVG)**.

### Fase 4: La Prueba de Fuego (Testing)

8.  **Usuario**: Hace click en "Rodilla Derecha" en el Body Map.
9.  **Agente (Pensamiento Interno)**:
    - _Input_: Dolor rodilla.
    - _Contexto Web (RAG)_: Busco "rodilla" en lo que acabo de aprender. Encuentro "Rehabilitación LCA" y "EPI Ecoguiada".
10. **Agente (Respuesta)**: _"Para molestias en la rodilla, veo que en tu clínica realizáis la **EPI Ecoguiada**. ¿Es un dolor agudo o una molestia al correr?"_

---

## 3. ¿Cómo verificas (tú y el usuario) la información?

Para que el usuario (el dueño del negocio) confíe, añadiremos un botón de **"Ver Cerebro"** o **"Debug Info"**.

### Panel "Ver lo que sé" (Drawer Lateral)

Si el usuario hace click en un icono de 🧠 "Cerebro", se abre un panel lateral:

- **Resumen Extraído**:
  - **Servicios**: [Punción Seca, Masaje, Osteopatía...]
  - **Precios Detectados**: [40€, 50€...]
  - **Teléfono**: 912...
  - **Filosofía**: "Trato personalizado..."

### Debugging para ti (Desarrollo)

En la consola del navegador y en un log visual oculto, verás:

- `Chunk #1`: Texto crudo extraído de /servicios.
- `Tags`: [SERVICE], [PRICING].
- Esto te permitirá ajustar el "Prompt Clasificador" si ves que se está dejando cosas.

## 4. Tecnología Necesaria para este Flujo

1.  **WebSockets (Socket.io)**: Ya lo tienes en el backend. Imprescindible para enviar el progreso paso a paso ("Detectado servicio X") al frontend.
2.  **Estado Reactivo (Signals)**: En Angular, usaremos signals para actualizar la lista de "Servicios Detectados" en tiempo real sin recargar.

## Conclusión

El "delay" del scraping no es un problema, es una **oportunidad de venta**. Mostrar "Detectando servicio X..." en tiempo real convence al usuario de que la IA está trabajando de verdad, creando un efecto "Wow" muy potente.

# UX Flow Asistida: Guiando al Usuario durante el Aprendizaje

Este documento define la estrategia para gestionar las expectativas del usuario y evitar frustraciones durante el tiempo de "gap" (mientras el agente aprende).

## 1. El Problema del "Gap"

Si el usuario pregunta: _"¿Qué precio tiene la ortodoncia?"_ justo antes de que el agente haya leído la página de precios, el agente responderá: _"No lo sé"_. Esto rompe la magia.

**Solución**: No dejar al usuario "suelto" en un campo abierto. **Guiarlo**.

---

## 2. Estrategia: "Restricción Dinámica Asistida"

En lugar de un chat abierto desde el segundo 0, usaremos **Sugerencias Inteligentes (Smart Chips)** que evolucionan según lo que el agente YA sabe.

### Fase 1: Solo Home Escaneada (0s - 10s)

- **Estado del Conocimiento**: Nombre, Teléfono, Dirección, Título Principal ("Clínica Dental integral").
- **UI del Chat**:
  - Agente: _"Hola, soy el asistente de Clínica Dental Sonrisas. Estoy aprendiendo vuestros servicios ahora mismo. Mientras tanto..."_
  - **Chips Visibles** (Solo lo seguro): `📍 ¿Dónde estáis?`, `📞 Teléfono`, `🕒 Horarios` (si estaban en home).
  - **Input Texto**: Abierto, pero con un placeholder: _"Pregúntame algo básico..."_

### Fase 2: Descubrimiento Progresivo (10s - 40s)

- **Evento**: El backend termina de leer `/tratamientos/ortodoncia`.
- **UI del Chat (Live Update)**:
  - Aparece un **Toast animado**: _"✨ Aprendido: Ortodoncia y Precios"_
  - **Nuevos Chips**: Aparecen mágicamente botones nuevos: `🦷 Precios Ortodoncia`, `❓ Tipos de Brackets`.
  - Agente (Interrupción proactiva suave): _"Ya he leído vuestra sección de Ortodoncia. Veo que tenéis Invisalign. ¿Quieres que simulemos una consulta sobre eso?"_

### Fase 3: Conocimiento Completo (>40s)

- **Estado**: Web completa indexada.
- **UI del Chat**:
  - Agente: _"¡Entrenamiento completado al 100%! Pregúntame lo que quieras."_
  - **Input Texto**: Totalmente libre.

---

## 3. Manejo de Errores ("Fail Gracefully")

¿Qué pasa si el usuario es rebelde y pregunta por "Implantes" cuando aún no se ha leído esa página?

**La Respuesta "Honesta pero Esperanzadora"**:
En lugar de decir _"No lo sé"_, el prompt del sistema debe estar configurado para decir:

> _"Aún estoy leyendo vuestra sección de tratamientos complejos, dame unos segundos para confirmarte el precio exacto de los implantes. Mientras tanto, ¿te ayudo con la dirección?"_

**Técnica**: El agente verifica su "estado de carga". Si la búsqueda vectorial da score bajo pero el proceso de scraping sigue activo, usa la respuesta de "espera", no la de "desconocimiento".

## 4. Conclusión

No restringimos prohibiendo escribir, restringimos **guiando la atención** hacia lo que SÍ sabemos. Usamos los botones (chips) para canalizar al usuario por el camino seguro mientras el "camino difícil" se construye en segundo plano.

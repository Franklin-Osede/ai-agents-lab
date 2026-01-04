# Visión de Producto SaaS: El Dashboard de Autonomía Total (Admin Panel)

Este documento define la estrategia para convertir la herramienta en un producto SaaS escalable (B2B), donde el cliente tiene control total sobre el conocimiento y comportamiento de su agente.

## 1. El Concepto: "Transparencia y Control"

Muchos dueños de negocio desconfían de la IA ("caja negra"). Tu propuesta de valor se dispara si les das el volante.
**Propuesta**: "La IA hace el trabajo duro (scraping), tú eres el director (configuración)."

---

## 2. Funcionalidades Clave del Panel de Admin

### A. La Auditoría de Conocimiento ("Knowledge Inspector")

Después del scraping automático, el cliente entra al panel y ve:

- **Vista de "Lo que sé"**: Una lista limpia de datos extraídos.
  - _Servicio_: Depilación Láser -> _Precio_: 40€ -> _Fuente_: `/tarifas`
- **Acciones**:
  - ✏️ **Editar**: "No, el precio subió a 45€". (Corrección manual instantánea).
  - ❌ **Borrar**: "Esto era una oferta antigua, olvídala".
  - ➕ **Añadir Manualmente**: "Hacemos un servicio nuevo que aún no está en la web".

> **Impacto**: Elimina el miedo a las "alucinaciones". El cliente valida lo que el bot dirá.

### B. El Constructor de Flujos ("Flow Tuner")

Más allá de responder dudas, el bot debe vender. Aquí el cliente afina la estrategia.

- **FAQ Builder Autogenerado**:
  - La IA sugiere: _"He detectado que tu web habla mucho de 'Dolor post-operatorio'. ¿Quieres que configure una respuesta empática específica para esto?"_
  - Cliente: ✅ Aceptar. (Se crea la regla automáticamente).
- **Custom Triggers**:
  - _"Si preguntan por PRECIO -> Termina ofreciendo FINANCIACIÓN."_
  - _"Si preguntan por CITA -> Ofrece primero la tarde."_

### C. Analíticas de Conversión

- No solo "número de chats".
- Métricas de negocio: _"El agente recuperó 15 clientes que preguntaron por precio y se iban a ir."_

---

## 3. Estrategia de Distribución: "Plug & Play Widget"

Para escalar como SaaS, la integración debe ser trivial.
**El Widget Universal**:

- Un simple script `<script src="ai-agents-lab.com/widget.js?id=CLIENTE"></script>`.
- Compatible con WordPress, Shopify, Wix, Webflow y HTML puro.
- **Personalización Visual**: Desde el Admin Panel, el cliente elige el color y el avatar del widget para que cuadre con su marca.

---

## 4. Evolución del Modelo de Negocio

1.  **Freemium / Trial**:
    - Scraping básico (Home).
    - 50 chats/mes.
    - Widget con marca de agua "Powered by AI Agents Lab".
2.  **Pro (SaaS)**:
    - Scraping profundo + Re-escaneo semanal automático.
    - Panel de Admin completo (Edición de conocimiento).
    - Widget Marca Blanca.
3.  **Enterprise (Agencia)**:
    - Tú configuras flows complejos a medida.
    - Integraciones CRM avanzadas.

## 5. Conclusión Técnica yUX

Esta capa de "Admin Panel" transforma tu proyecto de una "demo técnica" a un **Producto SaaS Vendible**.

- **Front del Cliente (Widget)**: Sencillo, voz, conversión.
- **Back del Cliente (Dashboard)**: Control, datos, seguridad.

**Siguiente Paso Lógico**: Diseñar la arquitectura de datos para que el conocimiento sea editable (`is_verified_by_user: boolean`) y construir el endpoint de scraping que alimente esta vista inicial.

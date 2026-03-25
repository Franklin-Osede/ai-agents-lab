# Estrategia de Autenticación y Nuevo Flujo UX (Post-Discovery)

Este documento define cómo integrar el login de forma eficiente y rediseña el flujo de usuario para acomodar la nueva fase de "Entrenamiento del Agente".

## 1. Estrategia de Autenticación (Google Login + Postgres)

**¿Google Login?** SÍ, ABSOLUTAMENTE.
Para B2B (dueños de clínicas), **Google Login es obligatorio**. Nadie quiere crear "otra contraseña más". Reduce la fricción de registro a cero.

**Arquitectura de Auth (Híbrida & Simple):**

1.  **Backend**: `Passport.js` (estándar en NestJS) con `passport-google-oauth20`.
2.  **Base de Datos (Postgres)**:
    - Tabla `users`:
      - `id`: UUID
      - `email`: (del Google Profile)
      - `google_id`: (Identificador único de Google)
      - `tenant_id`: (Link a sus datos)
3.  **Flujo**:
    - Frontend: Botón "Sign in with Google".
    - Backend: Verifica token -> Si el email no existe en DB, lo crea (Registro automático) -> Devuelve JWT propio de tu app.

> **Veredicto**: No necesitas Supabase/Auth0 para esto. Implementar "Google Login" en NestJS son 2 archivos y te ahorras costes y dependencias externas.

---

## 2. Nuevo Flujo UX: "The Training Phase"

El flujo anterior era: _Seleccionar Especialidad -> Chatear_.
El nuevo flujo debe insertar la fase de "Conexión de Cerebro".

### Paso 1: Selección de Nicho (Landing Page)

- **UI**: Grid de tarjetas (Fisioterapia, Dentista, Restaurante...).
- **Usuario**: Clic en **"Fisioterapia Demo"**.

### Paso 2: El "Pre-Roll" (Nuevo Layout)

Antes de ver el chat, el usuario aterriza en una pantalla de **Configuración Rápida (Onboarding)**.

- **Visual**: Limpio, profesional, centrado.
- **Acción**:
  > \*"Para personalizar la demo, necesito aprender de tu negocio.
  > [ Input: Pon tu web aquí ]
  >
  > ...o [ Usar datos de prueba (Clínica Ficticia) ]"\*
- **Por qué es vital**:
  - Si el usuario NO tiene web (curioso), usa la ficticia y ve la magia.
  - Si TIENE web (cliente potencial), pone la URL y se engancha.

### Paso 3: La Transición "Wow" (Training Screen)

- Al dar intro, **NO vamos al chat directo**.
- Vamos a una pantalla de transición de 3-5 segundos:
  - _"Conectando con fisio-madrid.com..."_
  - _"Leyendo tratamientos..."_
  - _"Configurando Agente..."_
- **Auto-Redirección**: Al terminar la fase rápida (Home), el sistema redirige automáticamente al **Chat Principal**.

### Paso 4: El Chat Híbrido (Body Map + Conversación)

- Ahora sí, el usuario está en el chat.
- **Diferencia**:
  - El agente le saluda por el nombre de SU clínica: _"Hola, soy el asistente virtual de FisioMadrid..."_
  - El Body Map está activo a la derecha (desktop) o arriba (móvil).

---

## 3. Resumen de Cambios Técnicos Necesarios

1.  **Frontend**:
    - Crear pantalla `SetupComponent` (Input URL).
    - Crear pantalla `TrainingProgressComponent` (La transición).
    - Modificar `RiderAgent` (Chat) para recibir el `context_id` inicializado.
2.  **Backend Auth**:
    - Instalar `passport-google-oauth20`.
    - Crear entidad `User`.

**Recomendación**: Primero terminemos la "Demo Simple" (Poner URL -> Ver Chat) sin Login obligatorio. El Login se añade justo cuando quieran "Guardar este agente" o "Ver el Admin Panel". **No pongas el Login como barrera de entrada a la demo**, o perderás el 50% de los leads.

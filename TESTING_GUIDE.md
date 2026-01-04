# 🎯 Guía de Prueba - Knowledge Platform

## URLs de Acceso

- **Backend**: http://localhost:57319
- **Frontend**: http://localhost:63679
- **Nueva Pantalla**: http://localhost:63679/knowledge/setup

## Flujo de Prueba

### 1. Navegar a Setup

Abre en tu navegador:

```
http://localhost:63679/knowledge/setup
```

Deberías ver:

- Título: "Convierte tu web en un Agente de IA en 60 segundos"
- Input para URL con placeholder "https://tu-negocio.com"
- Botón "Crear Agente" con icono ✨
- Botón "Probar con datos ficticios"

### 2. Probar el Flujo

**Opción A: Con URL Real**

1. Introduce: `https://example.com`
2. Click en "Crear Agente"
3. Deberías ver la pantalla de Training Overlay
4. El terminal mostrará logs animados
5. Después de ~8 segundos, te redirige al chat

**Opción B: Con Datos Ficticios**

1. Click en "Probar con datos ficticios"
2. Mismo flujo que la Opción A

### 3. Verificar en Consola del Navegador

Abre DevTools (F12) y ve a la pestaña Console. Deberías ver:

```
WebSocket connected
Training started: {sourceId: "src-...", status: "processing"}
```

Si ves errores de CORS o 404, significa que hay un problema de configuración.

### 4. Verificar en Backend

En la terminal donde corre el backend, deberías ver:

```
[PuppeteerScraperAdapter] Launching Puppeteer for https://example.com
[PuppeteerScraperAdapter] Navigating to https://example.com
[PuppeteerScraperAdapter] Scraped Example Domain - 127 chars
```

## Problemas Comunes

### Error: "Cannot POST /api/v1/knowledge/ingest"

**Solución**: El backend no está corriendo o la ruta está mal

- Verifica que el backend esté en http://localhost:57319
- Revisa `environment.ts` que tenga `apiBaseUrl: "http://localhost:57319/api/v1"`

### Error: CORS

**Solución**: El backend debe permitir el origen del frontend

- Verifica en `backend/src/main.ts` que CORS esté habilitado
- Debe permitir `http://localhost:63679`

### La pantalla no carga

**Solución**: El módulo no está compilado correctamente

- Verifica que no haya errores de compilación en la terminal del frontend
- Intenta hacer Ctrl+C y volver a correr `ng serve --port 63679`

## Próximos Pasos

Una vez que este flujo funcione:

1. Conectar el WebSocket real (ahora es simulación)
2. Redirigir las rutas de Fisioterapia a `/knowledge/setup`
3. Implementar el Body Map para la pantalla final
4. Guardar el conocimiento en la base de datos

## Estado Actual

✅ Backend API funcional
✅ Scraping real con Puppeteer
✅ Frontend screens creadas
⏳ Integración WebSocket en progreso
⏳ Navegación desde landing pendiente

# 🚀 Inicio Rápido - Backend y Frontend

## ⚠️ Problema: Chat no funciona

**Causa:** El backend no está corriendo en `http://localhost:3000`

---

## ✅ Solución: Iniciar el Backend

### Opción 1: Script Automático (Más Fácil)

Desde la raíz del proyecto:

```bash
npm run start:backend
```

Esto iniciará el backend en modo desarrollo.

**Mantén esta terminal abierta** mientras usas el frontend.

---

### Opción 2: Manual (Si el script no funciona)

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

Espera a ver:
```
🚀 Application is running on: http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

---

### Opción 3: Ambos Juntos

Desde la raíz:

```bash
npm start
```

Esto inicia backend y frontend simultáneamente.

---

## ✅ Verificar que Funciona

### 1. Backend está corriendo

Abre en el navegador:
```
http://localhost:3000/api/v1/health
```

**Deberías ver:**
```json
{"status":"ok","timestamp":"...","uptime":123}
```

### 2. Prueba el endpoint del chat

```bash
curl -X POST http://localhost:3000/api/v1/demo/booking/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola"}'
```

**Deberías recibir una respuesta JSON del agente.**

---

## 🔧 Si Sigue Sin Funcionar

### Verificar Puerto 3000

```bash
lsof -i :3000
```

Si hay algo, mátalo:
```bash
kill -9 [PID]
```

### Verificar .env

Asegúrate de que `backend/.env` tiene:
```
PORT=3000
OPENAI_API_KEY=tu-api-key-real
```

### Ver Errores en Terminal

Si el backend no inicia, revisa los errores. Errores comunes:
- `OPENAI_API_KEY` faltante o inválida
- Puerto 3000 ocupado
- Dependencias faltantes (`npm install`)

---

## 📝 Nota Importante

**El backend DEBE estar corriendo antes de usar el chat.**

Sin el backend, verás:
- ❌ `ERR_CONNECTION_REFUSED`
- ❌ Mensaje: "No se pudo conectar con el servidor"

Con el backend corriendo:
- ✅ El chat funciona
- ✅ El agente responde
- ✅ La disponibilidad se verifica

---

## 🎯 Flujo Correcto

1. ✅ **Terminal 1:** `npm run start:backend` (o `cd backend && npm run start:dev`)
2. ✅ **Esperar:** Ver mensaje "Application is running on: http://localhost:3000"
3. ✅ **Terminal 2:** `cd frontend && npm start` (si no usaste `npm start`)
4. ✅ **Navegador:** Abre `http://localhost:4200`
5. ✅ **Prueba:** Click en "Probar Demo" → Selecciona servicio → Chatea

---

**Última actualización:** 2024-12-10

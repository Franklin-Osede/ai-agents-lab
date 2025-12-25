# 🔧 Solución Rápida: Backend No Responde

## ⚠️ Problema Actual

El chat muestra: `ERR_CONNECTION_REFUSED` porque el backend no está corriendo.

---

## ✅ Solución Inmediata

### Paso 1: Abre una Terminal Nueva

**IMPORTANTE:** Debes tener el backend corriendo en una terminal separada.

### Paso 2: Inicia el Backend

```bash
cd /Users/domoblock/Documents/Projycto/ai-agents-lab-new/backend
npm run start:dev
```

### Paso 3: Espera a Ver Este Mensaje

```
🚀 Application is running on: http://localhost:3000
📚 API Documentation: http://localhost:3000/api/docs
```

**NO CIERRES ESTA TERMINAL** - El backend debe seguir corriendo.

### Paso 4: Prueba el Chat

Ahora el frontend debería poder conectarse.

---

## 🔍 Verificar que Funciona

### Test Rápido:

```bash
# En otra terminal
curl http://localhost:3000/api/v1/health
```

**Debería responder:**
```json
{"status":"ok","timestamp":"...","uptime":123,"environment":"development","version":"1.0.0"}
```

---

## ❌ Si Sigue Sin Funcionar

### 1. Verificar Puerto

```bash
# Ver si algo está usando el puerto 3000
lsof -i :3000
```

Si hay algo, mátalo:
```bash
kill -9 [PID]
```

### 2. Verificar .env

Asegúrate de que `backend/.env` existe y tiene:
```
PORT=3000
OPENAI_API_KEY=tu-key-aqui
```

### 3. Reinstalar Dependencias

```bash
cd backend
rm -rf node_modules
npm install
npm run start:dev
```

### 4. Ver Errores

Si el backend no inicia, revisa los errores en la terminal. Errores comunes:
- `OPENAI_API_KEY` faltante
- Puerto 3000 ocupado
- Dependencias faltantes

---

## 📝 Nota Importante

**El backend DEBE estar corriendo antes de usar el frontend.**

El frontend intenta conectarse a `http://localhost:3000` cuando:
- Seleccionas un servicio
- Envías un mensaje en el chat
- El agente verifica disponibilidad

Sin el backend, verás el error: `ERR_CONNECTION_REFUSED`

---

## 🎯 Flujo Correcto

1. ✅ Terminal 1: `cd backend && npm run start:dev` (mantener abierto)
2. ✅ Terminal 2: `cd frontend && npm start` (mantener abierto)
3. ✅ Navegador: Abre `http://localhost:4200`
4. ✅ Prueba el demo

---

**Última actualización:** 2024-12-10







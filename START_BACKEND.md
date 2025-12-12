# 🚀 Cómo Iniciar el Backend

## ⚠️ Problema: Chat no funciona (ERR_CONNECTION_REFUSED)

**Causa:** El backend no está corriendo en `http://localhost:3000`

---

## ✅ Solución Rápida

### Opción 1: Terminal Separada (Recomendado)

**Abre una nueva terminal y ejecuta:**

```bash
cd backend
npm run start:dev
```

**Deberías ver:**
```
🚀 Application is running on: http://localhost:3000
📚 API Documentation: http://localhost:3000/api/docs
```

**Mantén esta terminal abierta** mientras usas el frontend.

---

### Opción 2: Verificar si ya está corriendo

```bash
# Ver qué está usando el puerto 3000
lsof -i :3000

# O probar directamente
curl http://localhost:3000/api/v1/health
```

Si responde, el backend ya está corriendo.

---

## 🔧 Solución de Problemas

### Error: Puerto 3000 ya en uso

```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso (reemplaza PID)
kill -9 PID

# O cambiar puerto en backend/.env
PORT=3001
```

### Error: OPENAI_API_KEY no encontrada

1. Verifica que `backend/.env` existe
2. Agrega tu API key:
   ```
   OPENAI_API_KEY=sk-tu-key-aqui
   PORT=3000
   ```

### Error: Módulos no encontrados

```bash
cd backend
rm -rf node_modules
npm install
```

---

## ✅ Verificar que Funciona

### Test 1: Health Check
```bash
curl http://localhost:3000/api/v1/health
```
**Debería responder:** `{"status":"ok"}`

### Test 2: Demo Endpoint
```bash
curl -X POST http://localhost:3000/api/v1/demo/booking/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola"}'
```
**Debería responder:** JSON con respuesta del agente

---

## 📝 Notas

- El backend debe estar corriendo **antes** de usar el frontend
- Mantén la terminal del backend abierta
- Si cambias código, el backend se recarga automáticamente (watch mode)

---

**Última actualización:** 2024-12-10




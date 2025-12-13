# 🚀 Guía para Iniciar el Backend

## ⚠️ Error Común: ERR_CONNECTION_REFUSED

Si ves este error en el frontend:
```
Http failure response for http://localhost:3000/api/v1/demo/booking/chat: 0 Unknown Error
ERR_CONNECTION_REFUSED
```

**Significa que el backend no está corriendo.**

---

## 📋 Pasos para Iniciar el Backend

### 1. Navegar al directorio del backend

```bash
cd backend
```

### 2. Instalar dependencias (si es la primera vez)

```bash
npm install
```

### 3. Verificar variables de entorno

Asegúrate de que existe el archivo `.env` en `backend/`:

```bash
# backend/.env
PORT=3000
OPENAI_API_KEY=tu-api-key-aqui
NODE_ENV=development
```

### 4. Iniciar el servidor

**Opción A: Modo desarrollo (con hot reload)**
```bash
npm run start:dev
```

**Opción B: Modo producción**
```bash
npm run build
npm run start:prod
```

**Opción C: Modo watch (recomendado para desarrollo)**
```bash
npm run start:watch
```

### 5. Verificar que está corriendo

Deberías ver algo como:
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [InstanceLoader] CoreModule dependencies initialized
...
[Nest] INFO [NestApplication] Nest application successfully started
```

Y el servidor debería estar escuchando en:
```
http://localhost:3000
```

---

## 🧪 Probar que Funciona

### Opción 1: Desde el navegador

Abre en tu navegador:
```
http://localhost:3000/api/v1/demo/booking/chat
```

Deberías ver un error de método (esperado), pero confirma que el servidor responde.

### Opción 2: Con curl

```bash
curl -X POST http://localhost:3000/api/v1/demo/booking/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola"}'
```

Deberías recibir una respuesta JSON.

---

## 🔧 Solución de Problemas

### Problema: Puerto 3000 ya está en uso

**Solución:**
```bash
# Ver qué proceso está usando el puerto
lsof -i :3000

# Matar el proceso (reemplaza PID con el número que veas)
kill -9 PID

# O cambiar el puerto en .env
PORT=3001
```

### Problema: Error de compilación TypeScript

**Solución:**
```bash
# Limpiar y reinstalar
rm -rf node_modules dist
npm install
npm run build
```

### Problema: Falta OPENAI_API_KEY

**Solución:**
1. Obtén tu API key de OpenAI: https://platform.openai.com/api-keys
2. Agrega al `.env`:
   ```
   OPENAI_API_KEY=sk-tu-key-aqui
   ```

---

## 🎯 Iniciar Backend y Frontend Juntos

### Opción 1: Terminales separadas

**Terminal 1 (Backend):**
```bash
cd backend
npm run start:dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

### Opción 2: Usando concurrently (si está configurado)

Desde la raíz del proyecto:
```bash
npm run start
```

---

## ✅ Checklist

Antes de probar el demo, verifica:

- [ ] Backend está corriendo en `http://localhost:3000`
- [ ] No hay errores en la consola del backend
- [ ] El archivo `.env` existe y tiene `OPENAI_API_KEY`
- [ ] Frontend está corriendo (normalmente en `http://localhost:4200`)
- [ ] Puedes hacer una petición de prueba al endpoint `/api/v1/demo/booking/chat`

---

## 📝 Notas

- El backend usa **NestJS** y necesita Node.js 18+
- El frontend se conecta a `http://localhost:3000/api/v1` por defecto
- En producción, cambia la URL en `frontend/src/app/shared/services/api.service.ts`

---

**Última actualización:** 2024-12-10





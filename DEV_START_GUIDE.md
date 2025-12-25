# 🚀 Guía Rápida: Iniciar Frontend + Backend para Desarrollo

## 🎯 Opción Recomendada: npm (Más Rápida y Eficiente)

### ✅ Ventajas:
- ⚡ **Más rápido** - No necesita construir imágenes Docker
- 🔥 **Hot reload** funciona perfectamente
- 🐛 **Más fácil de debuggear**
- 💻 **Usa menos recursos** (RAM/CPU)

---

## 📋 Pasos Rápidos

### 1. Instalar Dependencias (Solo la primera vez)

```bash
# Desde la raíz del proyecto
npm run install:all
```

O manualmente:
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

### 2. Iniciar Todo (Backend + Frontend)

```bash
# Desde la raíz del proyecto
npm start
```

**Esto iniciará:**
- ✅ Backend en `http://localhost:3001`
- ✅ Frontend en `http://localhost:4200`

**Verás logs de ambos servicios con colores:**
- 🔵 **AZUL** = Backend
- 🟢 **VERDE** = Frontend

---

### 3. Acceder a la Aplicación

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3001/api/v1
- **Health Check:** http://localhost:3001/api/v1/health

---

## 🐳 Opción Alternativa: Docker (Si Prefieres)

### ✅ Ventajas:
- ✅ Aislamiento completo
- ✅ Mismo entorno en todos lados
- ✅ No necesitas instalar Node.js localmente

### ⚠️ Desventajas:
- ⚠️ Más lento (construir imágenes)
- ⚠️ Hot reload puede ser más lento
- ⚠️ Más consumo de recursos

---

### Pasos con Docker:

#### 1. Crear Dockerfiles de Desarrollo

**Backend Dockerfile.dev:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]
```

**Frontend Dockerfile.dev:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4200
CMD ["npm", "start"]
```

#### 2. Iniciar con Docker

```bash
# Iniciar (construir imágenes si es necesario)
npm run start:docker:build

# O solo iniciar (si ya están construidas)
npm run start:docker

# Detener
npm run stop:docker
```

---

## 🔧 Comandos Útiles

### Iniciar Solo Backend

```bash
npm run start:backend
# O manualmente:
cd backend && npm run start:dev
```

### Iniciar Solo Frontend

```bash
npm run start:frontend
# O manualmente:
cd frontend && npm start
```

### Verificar que Todo Funciona

```bash
# Backend health check
curl http://localhost:3001/api/v1/health

# Deberías ver: {"status":"ok","timestamp":"..."}
```

---

## 🐛 Solución de Problemas

### Error: Puerto 3001 ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3001

# Matar proceso
kill -9 <PID>
```

### Error: Puerto 4200 ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :4200

# Matar proceso
kill -9 <PID>
```

### Backend no inicia

1. **Verificar .env existe:**
   ```bash
   cd backend
   ls -la .env
   ```

2. **Verificar variables de entorno:**
   ```bash
   cat .env | grep OPENAI_API_KEY
   ```

3. **Ver logs:**
   ```bash
   cd backend
   npm run start:dev
   ```

### Frontend no conecta con Backend

1. **Verificar que backend está corriendo:**
   ```bash
   curl http://localhost:3001/api/v1/health
   ```

2. **Verificar URL en api.service.ts:**
   ```typescript
   // frontend/src/app/shared/services/api.service.ts
   private readonly baseUrl = 'http://localhost:3001/api/v1';
   ```

3. **Verificar CORS en backend:**
   ```typescript
   // backend/src/main.ts
   app.enableCors({
     origin: 'http://localhost:4200',
   });
   ```

---

## 📊 Comparación: npm vs Docker

| Característica | npm (Recomendado) | Docker |
|---------------|-------------------|--------|
| **Velocidad de inicio** | ⚡ Muy rápido | 🐌 Más lento |
| **Hot reload** | ✅ Instantáneo | ⚠️ Puede ser lento |
| **Debugging** | ✅ Fácil | ⚠️ Más complejo |
| **Recursos (RAM)** | 💚 Bajo | 🔴 Alto |
| **Aislamiento** | ⚠️ Menos | ✅ Total |
| **Configuración** | ✅ Simple | ⚠️ Requiere Dockerfiles |

---

## 🎯 Recomendación Final

**Para Desarrollo: Usa `npm start`**

```bash
npm start
```

**Razones:**
- ✅ Más rápido
- ✅ Hot reload perfecto
- ✅ Fácil de debuggear
- ✅ Menos recursos
- ✅ Ya está configurado

**Solo usa Docker si:**
- Necesitas el mismo entorno exacto en múltiples máquinas
- No quieres instalar Node.js localmente
- Estás probando deployment

---

## 🚀 Workflow Recomendado

### Primera Vez

```bash
# 1. Instalar dependencias
npm run install:all

# 2. Configurar .env en backend
cd backend
cp .env.example .env
# Editar .env con tus API keys

# 3. Iniciar todo
cd ..
npm start
```

### Desarrollo Diario

```bash
# Simplemente:
npm start
```

### Si algo falla

```bash
# Detener todo (Ctrl+C)

# Limpiar y reinstalar
cd backend && rm -rf node_modules && npm install && cd ..
cd frontend && rm -rf node_modules && npm install && cd ..

# Reiniciar
npm start
```

---

## 📝 Notas Importantes

1. **Puerto Backend:** `3001` (cambió de 3000 para evitar conflictos)
2. **Puerto Frontend:** `4200` (default de Angular)
3. **Hot Reload:** Funciona automáticamente en ambos
4. **Logs:** Se muestran en colores (azul=backend, verde=frontend)

---

## ✅ Checklist Rápido

- [ ] Dependencias instaladas (`npm run install:all`)
- [ ] `.env` configurado en `backend/.env`
- [ ] Backend corre en `http://localhost:3001`
- [ ] Frontend corre en `http://localhost:4200`
- [ ] Health check funciona: `curl http://localhost:3001/api/v1/health`
- [ ] Frontend puede comunicarse con backend

---

**Última actualización:** 2024-12-10
**Método recomendado:** `npm start` (concurrently)








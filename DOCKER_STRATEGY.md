# 🐳 Docker Strategy - AI Agents Lab

## 🤔 ¿Juntos o Separados?

### Opción 1: Docker Compose (Recomendado) ⭐
**Un solo `docker-compose.yml` con múltiples servicios**

**Ventajas:**
- ✅ Fácil de levantar todo: `docker-compose up`
- ✅ Networking automático entre servicios
- ✅ Un solo comando para todo
- ✅ Mejor para desarrollo local
- ✅ Variables de entorno compartidas

**Estructura:**
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DID_API_KEY=${DID_API_KEY}
  
  frontend:
    build: ./frontend
    ports:
      - "4200:4200"
    depends_on:
      - backend
```

**Comando:**
```bash
docker-compose up
```

---

### Opción 2: Imágenes Separadas
**Dos Dockerfiles independientes**

**Ventajas:**
- ✅ Más flexible para deploy separado
- ✅ Escalado independiente
- ✅ Mejor para producción distribuida

**Desventajas:**
- ❌ Más complejo de manejar
- ❌ Networking manual
- ❌ Más comandos

---

## 🎯 Recomendación: Docker Compose

**Para desarrollo y demo:** Usa Docker Compose (Opción 1)
- Más simple
- Un solo comando
- Perfecto para portfolio

**Para producción:** Puedes usar imágenes separadas si necesitas escalar independientemente

---

## 📋 Implementación

### Archivo: `docker-compose.yml` (raíz del proyecto)

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ai-agents-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DID_API_KEY=${DID_API_KEY}
    env_file:
      - ./backend/.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ai-agents-frontend
    ports:
      - "4200:4200"
    environment:
      - API_URL=http://backend:3000
    depends_on:
      - backend
    restart: unless-stopped
```

### Comandos:

```bash
# Levantar todo
docker-compose up

# Levantar en background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## 🚀 Para Deploy en Render/Railway

**Render/Railway manejan Docker automáticamente**, pero puedes:
1. Deploy backend y frontend como servicios separados
2. O usar un solo servicio con Docker Compose

**Recomendación para Render:**
- Backend: Servicio separado con Dockerfile
- Frontend: Servicio separado con Dockerfile
- Más fácil de escalar y mantener


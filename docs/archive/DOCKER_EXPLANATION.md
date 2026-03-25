# 🐳 Explicación de Docker Compose - AI Agents Lab

## 📋 ¿Qué es Docker Compose?

Docker Compose es una herramienta que permite definir y ejecutar **múltiples contenedores Docker** con un solo archivo de configuración.

---

## 🏗️ ¿Qué Hace Nuestro `docker-compose.yml`?

### Estructura General:

```yaml
services:
  backend:    # Servicio 1: API NestJS
  frontend:   # Servicio 2: App Angular
networks:     # Red para comunicación entre servicios
```

---

## 🔍 Explicación Detallada

### 1. Servicio Backend

```yaml
backend:
  build:
    context: ./backend          # Construye desde este directorio
    dockerfile: Dockerfile     # Usa este Dockerfile
  container_name: ai-agents-backend  # Nombre del contenedor
  ports:
    - "3000:3000"              # Puerto host:puerto contenedor
  environment:                 # Variables de entorno
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - DID_API_KEY=${DID_API_KEY}
  env_file:
    - ./backend/.env           # Carga variables desde .env
  healthcheck:                 # Verifica que esté saludable
    test: ["CMD", "wget", ...]
```

**¿Qué hace?**
- Construye la imagen del backend desde `./backend/Dockerfile`
- Expone el puerto 3000
- Inyecta variables de entorno (API keys)
- Verifica salud cada 30 segundos
- Se reinicia automáticamente si falla

---

### 2. Servicio Frontend

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: ai-agents-frontend
  ports:
    - "4200:4200"
  depends_on:
    backend:
      condition: service_healthy  # Espera a que backend esté saludable
```

**¿Qué hace?**
- Construye la imagen del frontend
- Expone el puerto 4200
- **Espera** a que el backend esté listo antes de iniciar
- Usa nginx para servir la app Angular compilada

---

### 3. Network (Red)

```yaml
networks:
  ai-agents-network:
    driver: bridge
```

**¿Qué hace?**
- Crea una red virtual para que los servicios se comuniquen
- Backend y Frontend pueden hablar entre sí usando nombres de servicio
- Ejemplo: Frontend puede llamar a `http://backend:3000` (no `localhost`)

---

## 🚀 Comandos Principales

### Levantar Todo:
```bash
docker-compose up
```

**¿Qué hace?**
1. Construye las imágenes (si no existen)
2. Crea la red
3. Inicia backend
4. Espera a que backend esté saludable
5. Inicia frontend
6. Muestra logs de ambos

---

### Levantar en Background:
```bash
docker-compose up -d
```

**¿Qué hace?**
- Lo mismo pero en segundo plano (detached)
- No bloquea la terminal

---

### Ver Logs:
```bash
docker-compose logs -f
```

**¿Qué hace?**
- Muestra logs de todos los servicios
- `-f` sigue los logs en tiempo real

---

### Detener Todo:
```bash
docker-compose down
```

**¿Qué hace?**
- Detiene todos los contenedores
- Elimina la red
- **NO elimina** las imágenes (para reusar)

---

### Reconstruir:
```bash
docker-compose up --build
```

**¿Qué hace?**
- Fuerza reconstrucción de imágenes
- Útil después de cambios en código

---

## 🔄 Flujo de Ejecución

```
1. docker-compose up
   ↓
2. Lee docker-compose.yml
   ↓
3. Construye imagen backend (si no existe)
   ↓
4. Inicia contenedor backend
   ↓
5. Backend hace healthcheck
   ↓
6. Backend está saludable ✅
   ↓
7. Construye imagen frontend (si no existe)
   ↓
8. Inicia contenedor frontend
   ↓
9. Frontend se conecta a backend vía red
   ↓
10. Todo funcionando! 🎉
```

---

## 🌐 Networking Interno

### Dentro de Docker:
- Frontend → `http://backend:3000` ✅
- Backend → `http://frontend:4200` ✅

### Desde tu máquina:
- Frontend → `http://localhost:4200` ✅
- Backend → `http://localhost:3000` ✅

**Importante:** Los servicios se comunican por nombres (`backend`, `frontend`), no por `localhost`.

---

## 📦 Volúmenes (Opcional para Desarrollo)

```yaml
volumes:
  - ./backend/src:/app/src
```

**¿Qué hace?**
- Monta tu código local en el contenedor
- Cambios en código se reflejan sin rebuild
- **Solo para desarrollo**, no para producción

---

## ✅ Ventajas de Docker Compose

1. **Un solo comando**: `docker-compose up`
2. **Networking automático**: Los servicios se encuentran solos
3. **Dependencias**: Frontend espera a backend automáticamente
4. **Aislamiento**: Cada servicio en su propio contenedor
5. **Reproducible**: Funciona igual en cualquier máquina
6. **Fácil deploy**: Mismo archivo para producción

---

## 🎯 Casos de Uso

### Desarrollo Local:
```bash
docker-compose up
# Código montado con volumes para hot reload
```

### Demo/Portfolio:
```bash
docker-compose up -d
# Todo corriendo en background
```

### Producción:
```bash
docker-compose -f docker-compose.prod.yml up -d
# Versión optimizada para producción
```

---

## ⚠️ Consideraciones

1. **Variables de Entorno**: Crea `.env` en raíz con:
   ```bash
   OPENAI_API_KEY=tu-key
   DID_API_KEY=tu-key
   ```

2. **Puertos**: Asegúrate que 3000 y 4200 estén libres

3. **Recursos**: Docker usa recursos del sistema, asegúrate de tener suficiente RAM

4. **Primera vez**: La primera construcción puede tardar varios minutos

---

## 🔧 Troubleshooting

### Backend no inicia:
```bash
docker-compose logs backend
# Ver logs del backend
```

### Frontend no se conecta:
```bash
# Verificar que backend esté saludable
docker-compose ps
```

### Reconstruir desde cero:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 📝 Resumen

**Docker Compose hace:**
- ✅ Levanta backend y frontend juntos
- ✅ Maneja networking automáticamente
- ✅ Gestiona dependencias (frontend espera backend)
- ✅ Healthchecks para verificar que todo funciona
- ✅ Un solo comando para todo

**Es como tener un "botón mágico" que levanta toda tu aplicación completa.**


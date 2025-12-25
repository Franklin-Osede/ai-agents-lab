# 🚀 Opciones de Deployment y Disponibilidad

## 📋 Tu Pregunta

1. **Usar otro puerto** (para evitar conflictos)
2. **Mantenerlo siempre disponible en local**
3. **Kubernetes - ¿gratis? ¿acceso público?**

---

## ✅ Solución 1: Cambiar Puerto

**Ya cambiado:**
- Backend: `PORT=3001` (en `backend/.env`)
- Frontend: `http://localhost:3001` (en `api.service.ts`)

**Para iniciar:**
```bash
cd backend
npm run start:dev
```

Ahora el backend correrá en `http://localhost:3001`

---

## 🏠 Opciones para Mantenerlo Disponible en Local

### Opción 1: PM2 (Recomendado para Desarrollo Local)

**Qué es:** Gestor de procesos que mantiene tu app corriendo siempre

**Instalación:**
```bash
npm install -g pm2
```

**Uso:**
```bash
cd backend
pm2 start npm --name "backend" -- run start:dev
pm2 save
pm2 startup  # Para iniciar automáticamente al arrancar el sistema
```

**Ventajas:**
- ✅ Se reinicia automáticamente si crashea
- ✅ Inicia automáticamente al encender la computadora
- ✅ Logs persistentes
- ✅ Muy fácil de usar

**Comandos útiles:**
```bash
pm2 list          # Ver procesos
pm2 logs backend  # Ver logs
pm2 restart backend  # Reiniciar
pm2 stop backend     # Detener
pm2 delete backend   # Eliminar
```

---

### Opción 2: Docker Compose (Para Desarrollo)

**Qué es:** Contenedores que se inician automáticamente

**Ventajas:**
- ✅ Aislamiento completo
- ✅ Fácil de compartir con equipo
- ✅ Configuración reproducible

**Desventajas:**
- ⚠️ Requiere Docker instalado
- ⚠️ Más complejo de configurar

---

### Opción 3: systemd (Linux) / launchd (macOS)

**Qué es:** Servicios del sistema operativo

**Ventajas:**
- ✅ Integración nativa con el sistema
- ✅ Inicia automáticamente

**Desventajas:**
- ⚠️ Más complejo de configurar
- ⚠️ Diferente en cada OS

---

## ☁️ Opciones de Deployment Público

### Opción 1: Railway.app (Recomendado - Gratis para empezar)

**Precio:**
- **Gratis:** $5 crédito/mes (suficiente para desarrollo)
- **Hobby:** $5/mes (más recursos)
- **Pro:** $20/mes

**Ventajas:**
- ✅ Muy fácil de usar
- ✅ Deploy con 1 click desde GitHub
- ✅ HTTPS automático
- ✅ Base de datos incluida
- ✅ URL pública automática (ej: `tu-app.railway.app`)

**Cómo funciona:**
1. Conectas tu repositorio GitHub
2. Railway detecta que es NestJS
3. Deploy automático
4. Obtienes URL pública: `https://tu-backend.railway.app`

**¿Todo el mundo puede acceder?**
- ✅ SÍ, si quieres que sea público
- ✅ Puedes proteger con API keys
- ✅ Puedes usar autenticación

---

### Opción 2: Render.com (Gratis con limitaciones)

**Precio:**
- **Gratis:** Tier gratuito disponible
- **Starter:** $7/mes

**Ventajas:**
- ✅ Plan gratuito disponible
- ✅ HTTPS automático
- ✅ Deploy desde GitHub

**Limitaciones (gratis):**
- ⚠️ Se "duerme" después de 15 min de inactividad
- ⚠️ Tarda ~30 segundos en "despertar"
- ⚠️ Menos recursos

---

### Opción 3: Fly.io (Gratis con límites)

**Precio:**
- **Gratis:** 3 VMs compartidas
- **Pago:** $1.94/mes por VM dedicada

**Ventajas:**
- ✅ Plan gratuito generoso
- ✅ Global (múltiples regiones)
- ✅ Muy rápido

---

### Opción 4: Kubernetes (NO es gratis, pero muy potente)

**Precio:**
- **Google Cloud (GKE):** ~$73/mes mínimo
- **AWS (EKS):** ~$73/mes mínimo
- **Azure (AKS):** ~$73/mes mínimo
- **DigitalOcean:** ~$12/mes (más barato)

**Ventajas:**
- ✅ Escalable infinitamente
- ✅ Muy robusto
- ✅ Profesional

**Desventajas:**
- ❌ **NO es gratis** (mínimo $12-73/mes)
- ❌ Complejo de configurar
- ❌ Overkill para proyectos pequeños

**¿Todo el mundo puede acceder?**
- ✅ SÍ, si configuras LoadBalancer público
- ✅ Puedes proteger con autenticación/API keys
- ✅ Puedes hacer privado con VPN

---

## 💡 Recomendación por Etapa

### Desarrollo Local (Ahora)

**Usa PM2:**
```bash
npm install -g pm2
cd backend
pm2 start npm --name "backend" -- run start:dev
pm2 save
pm2 startup
```

**Ventajas:**
- ✅ Gratis
- ✅ Siempre disponible en local
- ✅ Se reinicia automáticamente
- ✅ Fácil de usar

---

### Demo Público (Próximo paso)

**Usa Railway.app:**
1. Sube código a GitHub
2. Conecta Railway a GitHub
3. Deploy automático
4. URL pública: `https://tu-backend.railway.app`

**Costo:** Gratis para empezar ($5 crédito/mes)

**Configuración Frontend:**
```typescript
// frontend/src/app/shared/services/api.service.ts
private readonly baseUrl = 'https://tu-backend.railway.app/api/v1';
```

---

### Producción (Cuando tengas clientes)

**Opciones:**
1. **Railway.app Pro** ($20/mes) - Más recursos
2. **Fly.io** ($1.94/mes por VM) - Muy rápido
3. **DigitalOcean App Platform** ($5/mes) - Simple
4. **Kubernetes** ($12-73/mes) - Solo si necesitas escalar mucho

---

## 🔐 Seguridad: ¿Quién puede acceder?

### Opción 1: Público con API Keys

**Cómo funciona:**
- ✅ Cualquiera puede acceder a la URL
- ✅ Pero necesita API key válida
- ✅ Sin API key → Error 401

**Implementación:**
```typescript
// Ya lo tienes implementado
@UseGuards(ApiKeyGuard)
@Controller('agents/booking')
export class BookingAgentController {
  // Solo accesible con API key válida
}
```

---

### Opción 2: Privado (Solo tu frontend)

**Cómo funciona:**
- ✅ Solo tu frontend puede acceder
- ✅ CORS configurado para tu dominio
- ✅ Otros dominios → Error CORS

**Implementación:**
```typescript
// backend/src/main.ts
app.enableCors({
  origin: 'https://tu-frontend.com', // Solo este dominio
  credentials: true,
});
```

---

### Opción 3: Autenticación Completa

**Cómo funciona:**
- ✅ Usuarios deben registrarse
- ✅ Login requerido
- ✅ JWT tokens

**Ya lo tienes parcialmente implementado** con `AuthService`

---

## 🎯 Plan Recomendado

### Fase 1: Ahora (Desarrollo)

1. ✅ **Puerto cambiado a 3001** (evita conflictos)
2. ✅ **PM2 para mantener corriendo local**
3. ✅ **Backend en localhost:3001**

### Fase 2: Demo Público (Próxima semana)

1. **Railway.app** (gratis)
2. Deploy backend
3. URL pública: `https://tu-backend.railway.app`
4. Frontend apunta a esta URL

### Fase 3: Producción (Cuando tengas clientes)

1. **Railway Pro** o **Fly.io**
2. Base de datos real (PostgreSQL)
3. API keys por cliente
4. Monitoreo y logs

---

## 📝 Configuración PM2 (Recomendado para Local)

### Instalación

```bash
npm install -g pm2
```

### Configuración

```bash
cd backend

# Iniciar con PM2
pm2 start npm --name "ai-agents-backend" -- run start:dev

# Guardar configuración
pm2 save

# Configurar para iniciar al arrancar sistema
pm2 startup
# (Sigue las instrucciones que te da)
```

### Comandos Útiles

```bash
pm2 list                    # Ver todos los procesos
pm2 logs ai-agents-backend  # Ver logs en tiempo real
pm2 restart ai-agents-backend  # Reiniciar
pm2 stop ai-agents-backend     # Detener
pm2 delete ai-agents-backend   # Eliminar
pm2 monit                     # Monitor visual
```

---

## 🌐 Sobre Kubernetes

### ¿Es Gratis?

**NO.** Kubernetes requiere:
- Servidores (VMs) que cuestan dinero
- Mínimo: $12/mes (DigitalOcean)
- Típico: $73/mes (GCP/AWS/Azure)

### ¿Todo el mundo puede acceder?

**Depende de cómo lo configures:**

1. **Público:**
   - ✅ Cualquiera puede acceder a la URL
   - ✅ Protege con API keys
   - ✅ Ejemplo: `https://api.tu-app.com`

2. **Privado:**
   - ✅ Solo accesible desde tu red/VPN
   - ✅ Más seguro
   - ✅ Para aplicaciones internas

### ¿Cuándo usar Kubernetes?

**Solo si:**
- Tienes muchos usuarios (miles)
- Necesitas escalar automáticamente
- Tienes múltiples servicios
- Presupuesto: $50+/mes

**Para tu caso (ahora):**
- ❌ NO necesario
- ✅ Mejor: Railway/Fly.io ($0-20/mes)
- ✅ Más simple
- ✅ Suficiente para empezar

---

## 🚀 Próximos Pasos Inmediatos

1. **Cambiar puerto a 3001** ✅ (Ya hecho)
2. **Instalar PM2:**
   ```bash
   npm install -g pm2
   ```
3. **Iniciar backend con PM2:**
   ```bash
   cd backend
   pm2 start npm --name "backend" -- run start:dev
   pm2 save
   ```
4. **Verificar:**
   ```bash
   curl http://localhost:3001/api/v1/health
   ```

---

**Última actualización:** 2024-12-10
**Estado:** ✅ Puerto cambiado, PM2 recomendado para local







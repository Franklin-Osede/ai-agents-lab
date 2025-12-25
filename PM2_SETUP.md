# 🔄 Configurar PM2 para Mantener Backend Siempre Disponible

## 🎯 Objetivo

Mantener el backend corriendo siempre en local, incluso si:
- Cierras la terminal
- Reinicias la computadora
- El proceso crashea

---

## 📦 Instalación

```bash
npm install -g pm2
```

---

## 🚀 Configuración Rápida

### Paso 1: Ir al directorio del backend

```bash
cd /Users/domoblock/Documents/Projycto/ai-agents-lab-new/backend
```

### Paso 2: Iniciar con PM2

```bash
pm2 start npm --name "ai-agents-backend" -- run start:dev
```

### Paso 3: Guardar configuración

```bash
pm2 save
```

### Paso 4: Configurar inicio automático

```bash
pm2 startup
```

**Sigue las instrucciones** que te muestra (probablemente algo como):
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup launchd -u tu-usuario --hp /Users/tu-usuario
```

---

## 📋 Comandos Útiles

```bash
# Ver todos los procesos
pm2 list

# Ver logs en tiempo real
pm2 logs ai-agents-backend

# Ver últimas 50 líneas
pm2 logs ai-agents-backend --lines 50

# Reiniciar
pm2 restart ai-agents-backend

# Detener
pm2 stop ai-agents-backend

# Iniciar
pm2 start ai-agents-backend

# Eliminar
pm2 delete ai-agents-backend

# Monitor visual
pm2 monit

# Ver información detallada
pm2 show ai-agents-backend
```

---

## ✅ Verificar que Funciona

```bash
# Ver procesos
pm2 list

# Deberías ver:
# ┌─────┬─────────────────────┬─────────┬─────────┬──────────┐
# │ id  │ name                │ status  │ restart │ uptime   │
# ├─────┼─────────────────────┼─────────┼─────────┼──────────┤
# │ 0   │ ai-agents-backend   │ online  │ 0       │ 2m       │
# └─────┴─────────────────────┴─────────┴─────────┴──────────┘

# Probar endpoint
curl http://localhost:3001/api/v1/health
```

---

## 🔄 Reinicio Automático

PM2 reinicia automáticamente si:
- El proceso crashea
- La computadora se reinicia (si configuraste `pm2 startup`)
- El proceso se detiene inesperadamente

---

## 🎯 Ventajas

- ✅ **Siempre disponible** - No necesitas iniciarlo manualmente
- ✅ **Reinicio automático** - Si crashea, se reinicia solo
- ✅ **Logs persistentes** - Puedes ver logs históricos
- ✅ **Fácil de usar** - Comandos simples
- ✅ **Gratis** - Sin costo adicional

---

## 📝 Nota

**El backend ahora corre en puerto 3001** (cambié de 3000 para evitar conflictos).

El frontend ya está configurado para usar `http://localhost:3001`.

---

**Última actualización:** 2024-12-10








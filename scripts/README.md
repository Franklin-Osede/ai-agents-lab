# Scripts de Gestión de Memoria - AI Agents Lab

Scripts para optimizar el uso de memoria instalando dependencias solo cuando las necesitas.

## 🚀 Uso Rápido (Recomendado)

### ⚡ Iniciar Todo (Frontend + Backend)

```bash
./scripts/dev-start.sh
```

- Instala dependencias en paralelo si no existen
- Levanta ambos servidores simultáneamente
- **Forma más rápida de empezar a trabajar**

### 🛑 Detener y Limpiar Todo

```bash
./scripts/dev-stop.sh
```

- Detiene ambos servidores
- Elimina todas las dependencias (~888MB)
- Limpia archivos de build

---

## 🔧 Scripts Individuales (Opcional)

### Iniciar Solo Backend

```bash
./scripts/dev-start-backend.sh
```

- Instala dependencias si no existen
- Levanta servidor en `http://localhost:3005`

### Iniciar Solo Frontend

```bash
./scripts/dev-start-frontend.sh
```

- Instala dependencias si no existen
- Levanta servidor en `http://localhost:4210`

### Detener Solo Backend

```bash
./scripts/dev-stop-backend.sh
```

- Detiene el servidor
- Elimina `node_modules` (~444MB)
- Limpia `dist`

### Detener Solo Frontend

```bash
./scripts/dev-stop-frontend.sh
```

- Detiene el servidor
- Elimina `node_modules` (~444MB)
- Limpia `dist` y `.angular`

### Limpieza Completa (Sin Detener)

```bash
./scripts/cleanup-all.sh
```

- Limpia backend, frontend e infrastructure
- **Libera ~1.1GB**
- No detiene servidores activos

## 📋 Flujo de Trabajo Recomendado

1. **Al empezar a trabajar:**

   ```bash
   ./scripts/dev-start.sh
   ```

2. **Al terminar el día:**

   ```bash
   ./scripts/dev-stop.sh
   ```

3. **Limpieza rápida (sin detener servidores):**

   ```bash
   ./scripts/cleanup-all.sh
   ```

4. **Trabajar solo con backend o frontend:**
   ```bash
   ./scripts/dev-start-backend.sh  # Solo backend
   ./scripts/dev-start-frontend.sh # Solo frontend
   ```

## 💡 Beneficios

- ✅ **Ahorro de memoria**: ~1.1GB cuando no trabajas
- ✅ **Automático**: No necesitas recordar limpiar
- ✅ **Rápido**: Reinstalación automática al iniciar
- ✅ **Seguro**: Solo limpia dependencias, no código

## ⚠️ Notas

- Los scripts guardan PIDs en `.backend.pid` y `.frontend.pid`
- Estos archivos están en `.gitignore` automáticamente
- La primera instalación puede tardar 2-3 minutos
- Reinstalaciones posteriores usan caché de npm (más rápido)

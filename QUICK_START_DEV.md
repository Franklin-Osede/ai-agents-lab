# ⚡ Inicio Rápido para Desarrollo

## 🎯 Método Más Eficiente (Recomendado)

### Opción 1: Script Automático (Más Fácil)

```bash
./start-dev.sh
```

**Eso es todo.** El script:
- ✅ Verifica dependencias
- ✅ Instala lo que falta
- ✅ Inicia backend + frontend
- ✅ Muestra logs con colores

---

### Opción 2: Comando npm (Directo)

```bash
npm start
```

**Inicia:**
- 🔵 Backend en `http://localhost:3001`
- 🟢 Frontend en `http://localhost:4200`

---

## 🐳 Opción Alternativa: Docker

```bash
# Primera vez (construir imágenes)
npm run start:docker:build

# Siguientes veces
npm run start:docker

# Detener
npm run stop:docker
```

---

## ✅ Verificar que Funciona

1. **Backend:** http://localhost:3001/api/v1/health
2. **Frontend:** http://localhost:4200

---

## 🐛 Si Algo Falla

### Puerto ocupado

```bash
# Ver procesos
lsof -i :3001
lsof -i :4200

# Matar proceso
kill -9 <PID>
```

### Reinstalar dependencias

```bash
npm run install:all
```

---

**Recomendación:** Usa `npm start` o `./start-dev.sh` (más rápido que Docker)

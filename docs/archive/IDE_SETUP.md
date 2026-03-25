# IDE Setup Guide

## 🔧 Fixing TypeScript Errors in VS Code

Si ves errores de TypeScript que dicen "Cannot find module" pero el código compila correctamente:

### Solución 1: Recargar Window
1. `Cmd+Shift+P` (Mac) o `Ctrl+Shift+P` (Windows/Linux)
2. Escribe: "Reload Window"
3. Presiona Enter

### Solución 2: Verificar Workspace
Asegúrate de abrir la carpeta raíz del proyecto:
```
ai-agents-lab/  ← Abre esta carpeta
├── backend/
└── frontend/
```

NO abras solo la carpeta `backend/` o `frontend/`

### Solución 3: Limpiar Cache de TypeScript
1. `Cmd+Shift+P` → "TypeScript: Restart TS Server"
2. Espera a que se recargue

### Solución 4: Verificar tsconfig.json
El proyecto tiene:
- `tsconfig.json` en la raíz (workspace references)
- `backend/tsconfig.json` (configuración del backend)
- `frontend/tsconfig.json` (configuración del frontend)

## ✅ Estado Actual

- ✅ Backend compila correctamente
- ✅ Tests pasan (18 tests)
- ✅ Estructura correcta: `backend/` y `frontend/`
- ✅ Código sin errores de compilación

Los errores del IDE son solo de configuración, el código funciona perfectamente.



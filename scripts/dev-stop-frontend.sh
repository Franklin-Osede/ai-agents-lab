#!/bin/bash

# AI Agents Lab - Frontend Development Shutdown Script
# Detiene el servidor y limpia dependencias para liberar memoria

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
PID_FILE="$PROJECT_ROOT/.frontend.pid"

echo "🛑 Deteniendo frontend de AI Agents Lab..."

# Detener el servidor si está corriendo
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⏹️  Deteniendo servidor (PID: $PID)..."
        kill "$PID" 2>/dev/null || true
        sleep 2
        
        # Forzar si aún está corriendo
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "⚠️  Forzando detención..."
            kill -9 "$PID" 2>/dev/null || true
        fi
        
        echo "✅ Servidor detenido"
    else
        echo "ℹ️  El servidor no estaba corriendo"
    fi
    rm "$PID_FILE"
else
    echo "ℹ️  No se encontró archivo PID"
fi

# Limpiar dependencias
cd "$FRONTEND_DIR"

if [ -d "node_modules" ]; then
    echo "🧹 Eliminando node_modules..."
    BEFORE_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    rm -rf node_modules
    echo "✅ Liberados ~$BEFORE_SIZE"
else
    echo "ℹ️  node_modules ya estaba limpio"
fi

# Limpiar carpetas de build
if [ -d "dist" ]; then
    echo "🧹 Limpiando carpeta dist..."
    rm -rf dist
    echo "✅ dist eliminado"
fi

if [ -d ".angular" ]; then
    echo "🧹 Limpiando caché de Angular..."
    rm -rf .angular
    echo "✅ .angular eliminado"
fi

echo ""
echo "✨ Frontend limpio - memoria liberada"
echo "   Para volver a iniciar: ./scripts/dev-start-frontend.sh"

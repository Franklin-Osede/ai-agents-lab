#!/bin/bash

# AI Agents Lab - Frontend Development Startup Script
# Instala dependencias si no existen y levanta el servidor

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
PID_FILE="$PROJECT_ROOT/.frontend.pid"

echo "🚀 Iniciando frontend de AI Agents Lab..."

# Cambiar al directorio del frontend
cd "$FRONTEND_DIR"

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias (esto puede tardar unos minutos)..."
    pnpm install
    echo "✅ Dependencias instaladas"
else
    echo "✅ Dependencias ya instaladas"
fi

# Verificar si ya hay un servidor corriendo
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Ya hay un servidor corriendo (PID: $OLD_PID)"
        echo "   Usa ./scripts/dev-stop-frontend.sh para detenerlo primero"
        exit 1
    else
        rm "$PID_FILE"
    fi
fi

# Iniciar el servidor en background
echo "🔥 Levantando servidor Angular..."
pnpm run start &

# Guardar el PID
echo $! > "$PID_FILE"

echo "✅ Frontend iniciado (PID: $(cat "$PID_FILE"))"
echo "📍 Servidor corriendo en: http://localhost:4210"
echo ""
echo "Para detener y limpiar: ./scripts/dev-stop-frontend.sh"

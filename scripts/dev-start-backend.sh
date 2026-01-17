#!/bin/bash

# AI Agents Lab - Backend Development Startup Script
# Instala dependencias si no existen y levanta el servidor

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
PID_FILE="$PROJECT_ROOT/.backend.pid"

echo "🚀 Iniciando backend de AI Agents Lab..."

# Cambiar al directorio del backend
cd "$BACKEND_DIR"

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias (esto puede tardar unos minutos)..."
    npm install
    echo "✅ Dependencias instaladas"
else
    echo "✅ Dependencias ya instaladas"
fi

# Verificar si ya hay un servidor corriendo
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Ya hay un servidor corriendo (PID: $OLD_PID)"
        echo "   Usa ./scripts/dev-stop-backend.sh para detenerlo primero"
        exit 1
    else
        rm "$PID_FILE"
    fi
fi

# Iniciar el servidor en background
echo "🔥 Levantando servidor NestJS..."
npm run start:dev &

# Guardar el PID
echo $! > "$PID_FILE"

echo "✅ Backend iniciado (PID: $(cat "$PID_FILE"))"
echo "📍 Servidor corriendo en: http://localhost:3005"
echo ""
echo "Para detener y limpiar: ./scripts/dev-stop-backend.sh"

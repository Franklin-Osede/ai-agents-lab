#!/bin/bash

# AI Agents Lab - Inicio Completo (Frontend + Backend)
# Levanta ambos servidores en paralelo de forma rápida

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_PID_FILE="$PROJECT_ROOT/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/.frontend.pid"

echo "🚀 Iniciando AI Agents Lab (Frontend + Backend)..."
echo ""

# Función para instalar dependencias en paralelo
install_deps() {
    local dir=$1
    local name=$2
    
    cd "$dir"
    if [ ! -d "node_modules" ]; then
        echo "📦 Instalando dependencias de $name..."
        pnpm install > /dev/null 2>&1 &
        echo $!
    else
        echo "✅ $name: dependencias ya instaladas"
        echo "0"
    fi
}

# Instalar dependencias en paralelo
cd "$PROJECT_ROOT"
BACKEND_INSTALL_PID=$(install_deps "$BACKEND_DIR" "Backend")
FRONTEND_INSTALL_PID=$(install_deps "$FRONTEND_DIR" "Frontend")

# Esperar a que terminen las instalaciones
if [ "$BACKEND_INSTALL_PID" != "0" ] || [ "$FRONTEND_INSTALL_PID" != "0" ]; then
    echo "⏳ Instalando dependencias en paralelo..."
    
    if [ "$BACKEND_INSTALL_PID" != "0" ]; then
        wait $BACKEND_INSTALL_PID 2>/dev/null || true
        echo "✅ Backend: dependencias instaladas"
    fi
    
    if [ "$FRONTEND_INSTALL_PID" != "0" ]; then
        wait $FRONTEND_INSTALL_PID 2>/dev/null || true
        echo "✅ Frontend: dependencias instaladas"
    fi
fi

echo ""
echo "🔥 Levantando servidores..."

# Iniciar el servidor en background
echo "🔥 Levantando servidor NestJS..."
cd "$BACKEND_DIR"
pnpm run start:dev > "$PROJECT_ROOT/.backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"
echo "✅ Backend iniciado (PID: $BACKEND_PID) - http://localhost:3005"

# Iniciar el servidor en background
echo "🔥 Levantando servidor Angular..."
cd "$FRONTEND_DIR"
pnpm run start > "$PROJECT_ROOT/.frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
echo "✅ Frontend iniciado (PID: $FRONTEND_PID) - http://localhost:4210"

echo ""
echo "✨ AI Agents Lab corriendo!"
echo ""
echo "📍 URLs:"
echo "   Backend:  http://localhost:3005"
echo "   Frontend: http://localhost:4210"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f .backend.log"
echo "   Frontend: tail -f .frontend.log"
echo ""
echo "🛑 Para detener y limpiar: ./scripts/dev-stop.sh"

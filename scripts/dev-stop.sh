#!/bin/bash

# AI Agents Lab - Detención Completa (Frontend + Backend)
# Detiene ambos servidores y limpia dependencias

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_PID_FILE="$PROJECT_ROOT/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/.frontend.pid"

echo "🛑 Deteniendo AI Agents Lab..."
echo ""

TOTAL_FREED=0

# Función para detener servidor
stop_server() {
    local pid_file=$1
    local name=$2
    
    if [ -f "$pid_file" ]; then
        PID=$(cat "$pid_file")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "⏹️  Deteniendo $name (PID: $PID)..."
            kill "$PID" 2>/dev/null || true
            sleep 1
            
            # Forzar si aún está corriendo
            if ps -p "$PID" > /dev/null 2>&1; then
                kill -9 "$PID" 2>/dev/null || true
            fi
            echo "✅ $name detenido"
        fi
        rm "$pid_file"
    fi
}

# Función para limpiar dependencias
cleanup_deps() {
    local dir=$1
    local name=$2
    
    cd "$dir"
    
    if [ -d "node_modules" ]; then
        SIZE=$(du -sk node_modules 2>/dev/null | cut -f1)
        echo "🧹 Limpiando $name/node_modules..."
        rm -rf node_modules
        echo $SIZE
    else
        echo "0"
    fi
    
    # Limpiar builds
    rm -rf dist .angular 2>/dev/null || true
}

# Detener servidores
stop_server "$BACKEND_PID_FILE" "Backend"
stop_server "$FRONTEND_PID_FILE" "Frontend"

echo ""

# Limpiar dependencias en paralelo
BACKEND_SIZE=$(cleanup_deps "$BACKEND_DIR" "Backend")
FRONTEND_SIZE=$(cleanup_deps "$FRONTEND_DIR" "Frontend")

TOTAL_FREED=$((BACKEND_SIZE + FRONTEND_SIZE))

# Limpiar logs
rm -f "$PROJECT_ROOT/.backend.log" "$PROJECT_ROOT/.frontend.log"

# Convertir a formato legible
if [ $TOTAL_FREED -gt 1048576 ]; then
    FREED_GB=$(echo "scale=2; $TOTAL_FREED / 1048576" | bc)
    echo ""
    echo "✨ Limpieza completa - Liberados ~${FREED_GB}GB"
elif [ $TOTAL_FREED -gt 1024 ]; then
    FREED_MB=$(echo "scale=2; $TOTAL_FREED / 1024" | bc)
    echo ""
    echo "✨ Limpieza completa - Liberados ~${FREED_MB}MB"
else
    echo ""
    echo "✨ Limpieza completa"
fi

echo ""
echo "Para volver a iniciar: ./scripts/dev-start.sh"

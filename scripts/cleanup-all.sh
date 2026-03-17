#!/bin/bash

# AI Agents Lab - Limpieza Completa
# Limpia todas las dependencias y archivos de build del proyecto

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🧹 Limpieza completa de AI Agents Lab..."
echo ""

TOTAL_FREED=0

# Función para calcular tamaño
calculate_size() {
    if [ -d "$1" ]; then
        du -sk "$1" 2>/dev/null | cut -f1
    else
        echo "0"
    fi
}

# Limpiar backend
if [ -d "$PROJECT_ROOT/backend/node_modules" ]; then
    SIZE=$(calculate_size "$PROJECT_ROOT/backend/node_modules")
    echo "🗑️  Eliminando backend/node_modules..."
    rm -rf "$PROJECT_ROOT/backend/node_modules"
    TOTAL_FREED=$((TOTAL_FREED + SIZE))
fi

if [ -d "$PROJECT_ROOT/backend/dist" ]; then
    echo "🗑️  Eliminando backend/dist..."
    rm -rf "$PROJECT_ROOT/backend/dist"
fi

# Limpiar frontend
if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    SIZE=$(calculate_size "$PROJECT_ROOT/frontend/node_modules")
    echo "🗑️  Eliminando frontend/node_modules..."
    rm -rf "$PROJECT_ROOT/frontend/node_modules"
    TOTAL_FREED=$((TOTAL_FREED + SIZE))
fi

if [ -d "$PROJECT_ROOT/frontend/dist" ]; then
    echo "🗑️  Eliminando frontend/dist..."
    rm -rf "$PROJECT_ROOT/frontend/dist"
fi

if [ -d "$PROJECT_ROOT/frontend/.angular" ]; then
    echo "🗑️  Eliminando frontend/.angular..."
    rm -rf "$PROJECT_ROOT/frontend/.angular"
fi

# Limpiar infrastructure
if [ -d "$PROJECT_ROOT/infrastructure/node_modules" ]; then
    SIZE=$(calculate_size "$PROJECT_ROOT/infrastructure/node_modules")
    echo "🗑️  Eliminando infrastructure/node_modules..."
    rm -rf "$PROJECT_ROOT/infrastructure/node_modules"
    TOTAL_FREED=$((TOTAL_FREED + SIZE))
fi

# Limpiar root
if [ -d "$PROJECT_ROOT/node_modules" ]; then
    SIZE=$(calculate_size "$PROJECT_ROOT/node_modules")
    echo "🗑️  Eliminando node_modules raíz..."
    rm -rf "$PROJECT_ROOT/node_modules"
    TOTAL_FREED=$((TOTAL_FREED + SIZE))
fi

# Limpiar archivos PID
rm -f "$PROJECT_ROOT/.backend.pid"
rm -f "$PROJECT_ROOT/.frontend.pid"

# Convertir KB a formato legible
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
echo "Para volver a trabajar:"
echo "  Backend:  ./scripts/dev-start-backend.sh"
echo "  Frontend: ./scripts/dev-start-frontend.sh"

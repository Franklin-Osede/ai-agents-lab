#!/bin/bash

# Script para iniciar Frontend + Backend en desarrollo
# Uso: ./start-dev.sh

set -e

echo "🚀 Iniciando AI Agents Lab (Desarrollo)"
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Verificar que las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias de la raíz..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependencias del backend..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Instalando dependencias del frontend..."
    cd frontend && npm install && cd ..
fi

# Verificar .env en backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Advertencia: backend/.env no existe"
    echo "   Crea el archivo con tus variables de entorno"
fi

echo ""
echo "✅ Dependencias verificadas"
echo ""
echo "🔵 Backend: http://localhost:3005"
echo "🟢 Frontend: http://localhost:4210"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios"
echo ""

# Iniciar ambos servicios
npm start












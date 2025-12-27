#!/bin/bash

# Script para iniciar el backend
# Uso: ./start-backend.sh

cd "$(dirname "$0")/backend"

echo "🚀 Iniciando backend..."
echo "📁 Directorio: $(pwd)"
echo ""

# Verificar que .env existe
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado"
    echo "📝 Creando .env con valores por defecto..."
    echo "PORT=3000" > .env
    echo "OPENAI_API_KEY=tu-api-key-aqui" >> .env
    echo ""
    echo "⚠️  IMPORTANTE: Edita backend/.env y agrega tu OPENAI_API_KEY"
    echo ""
fi

# Verificar si el puerto está en uso
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Puerto 3000 ya está en uso"
    echo "🔍 Procesos usando el puerto:"
    lsof -i :3000
    echo ""
    read -p "¿Quieres matar el proceso? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti :3000 | xargs kill -9
        echo "✅ Proceso terminado"
        sleep 2
    else
        echo "❌ No se puede iniciar el backend. Puerto ocupado."
        exit 1
    fi
fi

# Iniciar backend
echo "🚀 Iniciando servidor..."
echo ""
npm run start:dev












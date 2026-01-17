#!/bin/bash
# Script para arreglar automáticamente todos los problemas de linting posibles
# Uso: ./scripts/fix-lint.sh

echo "🧹 Ejecutando ESLint Fix en todo el proyecto..."

# Backend
echo "🔧 Arreglando Backend..."
cd backend
pnpm eslint "{src,apps,libs,test}/**/*.ts" --fix
cd ..

# Frontend
echo "🔧 Arreglando Frontend..."
cd frontend
pnpm ng lint --fix
cd ..

echo "✨ Limpieza completada."

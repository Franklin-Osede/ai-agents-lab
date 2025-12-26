#!/bin/bash

echo "🔧 Migrando archivos CSS a SCSS..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd frontend/src/app/rider-agent/components

# Lista de componentes a migrar
components=(
  "restaurant-menu/restaurant-menu.component"
  "search-results/search-results.component"
  "reservations/reservations.component"
  "customizable-extras/customizable-extras.component"
  "order-tracking/order-tracking.component"
  "restaurant-details/restaurant-details.component"
  "payment-deposit/payment-deposit.component"
  "onboarding/onboarding.component"
  "order-history/order-history.component"
)

echo -e "${BLUE}Paso 1: Renombrando archivos .css a .scss${NC}"
echo ""

for component in "${components[@]}"; do
  css_file="${component}.css"
  scss_file="${component}.scss"
  
  if [ -f "$css_file" ]; then
    mv "$css_file" "$scss_file"
    echo -e "${GREEN}✅ Renombrado: ${component}.css → .scss${NC}"
  else
    echo -e "${YELLOW}⚠️  No encontrado: ${css_file}${NC}"
  fi
done

echo ""
echo -e "${BLUE}Paso 2: Actualizando referencias en archivos .ts${NC}"
echo ""

for component in "${components[@]}"; do
  ts_file="${component}.ts"
  
  if [ -f "$ts_file" ]; then
    # Reemplazar .css por .scss en el archivo
    sed -i '' 's/\.css/\.scss/g' "$ts_file"
    echo -e "${GREEN}✅ Actualizado: ${component}.ts${NC}"
  else
    echo -e "${YELLOW}⚠️  No encontrado: ${ts_file}${NC}"
  fi
done

echo ""
echo -e "${BLUE}Paso 3: Creando super-app-home.component.scss${NC}"
echo ""

# Crear archivo SCSS para super-app-home
cat > super-app-home/super-app-home.component.scss << 'EOF'
// Component-specific styles
:host {
  display: block;
  width: 100%;
  height: 100%;
}

// Custom animations
.search-input-focus {
  &:focus {
    outline: none;
    ring: 2px;
    ring-color: theme('colors.blue.500');
  }
}

// Component-specific transitions
.review-card {
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
  }
}

// Responsive overrides
@media (max-width: 390px) {
  .mobile-specific {
    // Mobile-specific styles if needed
  }
}
EOF

echo -e "${GREEN}✅ Creado: super-app-home/super-app-home.component.scss${NC}"

# Actualizar super-app-home.component.ts
if [ -f "super-app-home/super-app-home.component.ts" ]; then
  sed -i '' 's/styleUrls: \[\]/styleUrl: ".\/super-app-home.component.scss"/g' super-app-home/super-app-home.component.ts
  echo -e "${GREEN}✅ Actualizado: super-app-home/super-app-home.component.ts${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ¡Migración completada exitosamente!${NC}"
echo ""
echo -e "${YELLOW}Resumen:${NC}"
echo "- 9 archivos .css renombrados a .scss"
echo "- 9 archivos .ts actualizados"
echo "- 1 archivo .scss creado (super-app-home)"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo "1. Verificar que ng serve funciona sin errores"
echo "2. Verificar que los estilos se aplican correctamente"
echo "3. Commit los cambios"

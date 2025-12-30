# Análisis del Flujo de Menú y Imágenes

## Imágenes Faltantes

### Imágenes que se usan en el código pero no existen:
- `default.webp` - Imagen por defecto (se usa como fallback)

### Imágenes que existen pero podrían no estar siendo usadas:
Todas las imágenes en `frontend/src/assets/food_images/` están disponibles (62 imágenes).

## Flujo Actual vs Flujo Deseado

### Flujo Actual:
1. Usuario selecciona tipo de comida (japonesa, italiana, fast food, española)
2. Se muestran platos principales
3. Después de seleccionar principal, se ofrecen bebidas y postres
4. No hay detección inteligente de qué falta

### Flujo Deseado:
1. Usuario selecciona tipo de comida
2. Se muestran TODOS los platos (entrantes, principales, bebidas, postres)
3. Si selecciona MENÚ PRINCIPAL:
   - Sistema detecta: falta entrante, bebida, postre
   - Ofrece: "🥗 Entrantes", "🥤 Bebidas", "🍰 Postres"
4. Si luego selecciona BEBIDA:
   - Sistema detecta: ya tiene principal y bebida, falta entrante y postre
   - Ofrece: "🥗 Entrantes", "🍰 Postres"
5. Si luego selecciona ENTRANTE:
   - Sistema detecta: ya tiene principal, bebida y entrante, solo falta postre
   - Ofrece: "🍰 Postres"
6. Si luego selecciona POSTRE:
   - Sistema detecta: pedido completo
   - Ofrece: "✅ Finalizar" (en lugar de "Ya lo tengo todo")
   - Al finalizar: opciones "🛵 A domicilio" o "📅 Reservar Mesa"

## Categorías de Platos

### Categorías detectadas:
- **Entrantes/Starters**: tags incluyen "starter", "tapas", nombres como "Edamame", "Gyoza", "Miso Soup", "Ensalada César", "Calamares"
- **Principales/Mains**: tags incluyen "main", nombres como "Sushi Set", "Katsu Curry", "Bento Box", "Pizza", "Carbonara", "Hamburguesa"
- **Bebidas/Drinks**: tags incluyen "drink", "beverage", "Alcohol", "Soda", "Water", nombres como "Asahi", "Sake", "Cola", "Vino"
- **Postres/Desserts**: tags incluyen "dessert", "sweet", nombres como "Mochi", "Tiramisu", "Churros", "Brownie"

## Implementación Necesaria

1. Crear función `getMissingCategories()` que analice el carrito
2. Modificar estados del diálogo para incluir entrantes cuando se selecciona principal
3. Actualizar lógica de sugerencias para mostrar solo lo que falta
4. Cambiar "Ya lo tengo todo" por "Finalizar" cuando solo falta postre y se selecciona


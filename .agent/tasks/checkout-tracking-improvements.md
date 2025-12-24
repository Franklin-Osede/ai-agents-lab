## Resumen de Cambios Pendientes

### Checkout Component

1. ✅ CSS de Leaflet añadido
2. ✅ Autosuggest movido (pero necesita mejor posicionamiento)
3. ✅ Texto cambiado a "Pago Ficticio"
4. ✅ Overlay de confirmación añadido
5. ⏳ Botón de pago: reducir tamaño (text-base, py-3.5 en vez de text-xl, py-5)
6. ⏳ Footer: reducir padding (pt-4 pb-8 en vez de pt-6 pb-12)
7. ⏳ Autosuggest: mejorar visibilidad sobre el mapa

### Order Tracking Component

1. ⏳ Añadir countdown dinámico que baje de 5 minutos
2. ⏳ Actualizar "Llegando pronto" basado en tiempo restante
3. ⏳ Actualizar "Llegada estimada" dinámicamente
4. ⏳ Permitir navegación hacia atrás a pantalla de confirmación
5. ⏳ Sincronizar countdown con animación del mapa

### Notas

- El mapa en checkout puede verse gris si Leaflet no se inicializa correctamente
- Necesitamos asegurar que `invalidateSize()` se llame después de que el contenedor sea visible

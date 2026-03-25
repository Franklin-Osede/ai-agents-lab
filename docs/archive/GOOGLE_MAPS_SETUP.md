# 🗺️ Configuración de Google Maps Autocomplete

## 📋 Descripción

Este módulo proporciona un componente reutilizable de autocompletado de direcciones usando la API de Google Maps. Está diseñado siguiendo las mejores prácticas de Angular y puede ser usado en cualquier parte de la aplicación.

## 🚀 Características

- ✅ Autocompletado de direcciones con Google Places API
- ✅ Debounce para optimizar llamadas a la API
- ✅ Búsqueda restringida a direcciones (no lugares de interés)
- ✅ Restricción geográfica a México
- ✅ Componente completamente reutilizable
- ✅ Manejo de errores robusto
- ✅ Loading states y feedback visual

## 🔧 Configuración

### 1. Obtener API Key de Google Maps

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - **Places API**
   - **Geocoding API**
   - **Maps JavaScript API** (opcional, si quieres mostrar mapas)
4. Ve a "Credenciales" y crea una API Key
5. **IMPORTANTE**: Restringe la API Key:
   - Restricción de aplicación: HTTP referrers (websites)
   - Agrega tu dominio (ej: `localhost:4200/*`, `tudominio.com/*`)

### 2. Configurar en el Proyecto

Edita los archivos de environment:

**`frontend/src/environments/environment.ts`** (desarrollo):
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  googleMapsApiKey: 'TU_API_KEY_AQUI',
  // ...
};
```

**`frontend/src/environments/environment.prod.ts`** (producción):
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.agentslab.ai/api/v1',
  googleMapsApiKey: 'TU_API_KEY_AQUI',
  // ...
};
```

## 📦 Uso del Componente

### Uso Básico

```html
<app-google-maps-autocomplete
  [placeholder]="'Buscar dirección...'"
  [label]="'Dirección de Entrega'"
  (placeSelected)="onAddressSelected($event)"
  (addressChange)="onAddressChange($event)">
</app-google-maps-autocomplete>
```

### En el Componente TypeScript

```typescript
import { PlaceResult } from '../../shared/services/google-maps.service';

onAddressSelected(place: PlaceResult | null): void {
  if (place) {
    console.log('Dirección seleccionada:', place.formatted_address);
    console.log('Coordenadas:', {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    });
  }
}

onAddressChange(address: string): void {
  console.log('Texto cambiado:', address);
}
```

### Inputs Disponibles

- `placeholder`: Texto del placeholder (default: 'Buscar dirección...')
- `initialValue`: Valor inicial del input
- `label`: Etiqueta que se muestra arriba del input

### Outputs Disponibles

- `placeSelected`: Emite un `PlaceResult` cuando se selecciona una dirección
- `addressChange`: Emite el texto del input mientras el usuario escribe

## 🎯 Ejemplo de Uso en el Flujo de Restaurantes

El componente ya está integrado en el flujo de restaurantes para selección de dirección de entrega:

```typescript
// En demo-modal.component.ts
onAddressSelected(place: PlaceResult | null): void {
  if (place) {
    this.deliveryAddress = place;
    // Ir al calendario para seleccionar hora de entrega
    this.currentStep = 2;
  }
}
```

## 🔒 Seguridad

### Restricciones de API Key (Recomendado)

1. **Restricción de aplicación**: HTTP referrers
   - Desarrollo: `localhost:4200/*`
   - Producción: `tudominio.com/*`

2. **Restricción de API**: Solo habilita:
   - Places API
   - Geocoding API
   - Maps JavaScript API (si es necesario)

3. **Cuotas**: Configura límites diarios para evitar costos inesperados

## 💰 Costos

Google Maps tiene un plan gratuito generoso:
- **$200 USD de crédito mensual** (equivalente a ~28,000 solicitudes de Places API)
- Después del crédito, se cobra por uso

**Recomendaciones**:
- Monitorea el uso en Google Cloud Console
- Configura alertas de cuota
- Considera implementar caché para direcciones frecuentes

## 🐛 Troubleshooting

### El componente no muestra predicciones

1. Verifica que la API Key esté correctamente configurada
2. Asegúrate de que Places API esté habilitada
3. Revisa la consola del navegador para errores
4. Verifica las restricciones de la API Key

### Error: "This API project is not authorized"

- Verifica que Places API esté habilitada en Google Cloud Console
- Asegúrate de que la API Key tenga permisos para Places API

### Las predicciones no aparecen

- El componente requiere al menos 3 caracteres para buscar
- Verifica que no haya errores de CORS
- Revisa la consola para mensajes de error de Google Maps

## 📚 Recursos

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Places Autocomplete Service](https://developers.google.com/maps/documentation/javascript/places-autocomplete)
- [Google Cloud Console](https://console.cloud.google.com/)

## ✅ Checklist de Implementación

- [ ] API Key de Google Maps obtenida
- [ ] Places API habilitada en Google Cloud Console
- [ ] API Key configurada en `environment.ts` y `environment.prod.ts`
- [ ] Restricciones de API Key configuradas
- [ ] Componente importado en `app.module.ts`
- [ ] Probado en desarrollo
- [ ] Configurado para producción

---

**Nota**: Recuerda nunca commitear tu API Key en el repositorio. Usa variables de entorno o un servicio de gestión de secretos en producción.

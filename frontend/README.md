# AI Agents Lab - Frontend

Frontend Angular para el laboratorio de agentes de IA.

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js (v18 o superior)
- npm (v9 o superior)
- Angular CLI (se instalará automáticamente con npm install)

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
# o
ng serve
```

La aplicación estará disponible en `http://localhost:4200`

### Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en `dist/ai-agents-lab-frontend/`

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   └── landing-page/      # Página principal
│   ├── shared/
│   │   ├── components/
│   │   │   ├── agent-card/    # Tarjeta de agente
│   │   │   ├── chat-interface/ # Interfaz de chat
│   │   │   ├── demo-modal/     # Modal de demostración
│   │   │   └── metrics-panel/  # Panel de métricas
│   │   ├── models/             # Modelos de datos
│   │   └── services/           # Servicios (API, etc.)
│   └── app.module.ts
└── styles.scss                 # Estilos globales
```

## 🔌 Configuración de API

El servicio API está configurado para conectarse al backend en `http://localhost:3000/api/v1`.

Para cambiar la URL del backend, edita `src/app/shared/services/api.service.ts`:

```typescript
private readonly baseUrl = 'http://localhost:3000/api/v1';
```

## 🧪 Testing

```bash
npm test
```

## 📝 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Compila para producción
- `npm test` - Ejecuta las pruebas unitarias
- `ng generate component <nombre>` - Genera un nuevo componente

## 🎨 Características

- **Landing Page**: Página principal con tarjetas de agentes
- **Demo Modal**: Modal interactivo para probar cada agente
- **Chat Interface**: Interfaz de chat en tiempo real
- **Metrics Panel**: Panel de métricas en vivo

## 🔗 Agentes Disponibles

1. **Booking Agent** - Reserva automática de citas
2. **DM Response Agent** - Respuesta automática a mensajes directos
3. **Follow-up Agent** - Seguimiento automatizado de clientes

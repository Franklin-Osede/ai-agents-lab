# AI Agents Lab - JavaScript Widget

Widget embeddable para integrar agentes AI en cualquier website.

## Uso Rápido

### Opción 1: Con API Key (Producción)

```html
<div id="ai-booking-agent" 
     data-api-key="sk_live_xxx"
     data-agent="booking"
     data-business-id="biz_123">
</div>
<script src="https://cdn.agentslab.ai/widget.js"></script>
```

### Opción 2: Demo (Sin API Key)

```html
<div id="ai-booking-agent" 
     data-agent="booking">
</div>
<script src="https://cdn.agentslab.ai/widget.js"></script>
```

## Desarrollo

```bash
npm install
npm run dev    # Modo desarrollo con watch
npm run build  # Build para producción
```

## Configuración

- `data-agent`: Agente a usar (`booking`, `cart-recovery`, etc.)
- `data-api-key`: API Key (opcional para demo)
- `data-business-id`: ID del negocio (opcional)
- `data-api-url`: URL del API (default: https://api.agentslab.ai/api/v1)
- `data-theme`: Tema (`light` o `dark`)
- `data-primary-color`: Color principal (hex)




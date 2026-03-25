# 🛒 Configuración del Agente de Carritos Abandonados

## 📋 Resumen

Este agente permite recuperar carritos abandonados mediante:
- **WhatsApp**: Envío real de mensajes (con audio personalizado generado por IA)
- **Email**: Preview/Simulación de emails sin envío real (perfecto para demos)

---

## 🚀 Configuración Rápida

### 1. WhatsApp con Twilio (RECOMENDADO - Gratis para empezar)

> 💰 **Costo:** **1,000 mensajes GRATIS cada mes** - Perfecto para desarrollo y demos
> 
> 📊 **Ver comparación completa:** [WHATSAPP_PRICING_COMPARISON.md](./WHATSAPP_PRICING_COMPARISON.md)

#### Paso 1: Crear cuenta en Twilio
1. Ve a [Twilio Console](https://console.twilio.com/)
2. Crea una cuenta gratuita (incluye $15 de crédito + 1,000 mensajes WhatsApp gratis/mes)
3. Obtén tu `Account SID` y `Auth Token` desde el dashboard

#### Paso 2: Configurar WhatsApp Sandbox
1. En Twilio Console, ve a **Messaging > Try it out > Send a WhatsApp message**
2. Sigue las instrucciones para unirte al Sandbox
3. Envía el código que te dan al número de Twilio (ej: `join <código>`)
4. Una vez unido, puedes recibir mensajes en tu número

#### Paso 3: Configurar variables de entorno

Agrega a `backend/.env`:

```bash
# Twilio WhatsApp (Opcional - si no está configurado, funciona en modo simulación)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Número del Sandbox (por defecto)
```

#### Paso 4: Probar envío real

```bash
# El servicio detecta automáticamente si Twilio está configurado
# Si NO está configurado, funciona en modo simulación (solo logs)
# Si SÍ está configurado, envía mensajes reales
```

---

## 📧 Email Preview (Sin configuración necesaria)

El servicio de email **NO envía emails reales**. Solo genera HTML para preview.

**Ventajas:**
- ✅ No requiere configuración de SMTP/SendGrid
- ✅ No hay riesgo de ir a spam
- ✅ Perfecto para demos y desarrollo
- ✅ Genera HTML profesional listo para mostrar

---

## 🔌 Endpoints Disponibles

### 1. Enviar WhatsApp

```bash
POST /api/v1/agents/abandoned-cart/send-whatsapp
Content-Type: application/json

{
  "cartId": "cart-123",
  "phoneNumber": "+34612345678",  // Formato E.164
  "message": "Hola! Notamos que dejaste productos en tu carrito.",
  "audioUrl": "https://example.com/audio.mp3"  // Opcional
}
```

**Respuesta:**
```json
{
  "success": true,
  "messageId": "SM1234567890abcdef",
  "isEnabled": true  // false si está en modo simulación
}
```

### 2. Preview de Email

```bash
POST /api/v1/agents/abandoned-cart/preview-email
Content-Type: application/json

{
  "cartId": "cart-123",
  "customerName": "Juan Pérez",
  "customerEmail": "juan@example.com",
  "cartItems": [
    {
      "name": "Producto 1",
      "quantity": 2,
      "price": 50.00
    },
    {
      "name": "Producto 2",
      "quantity": 1,
      "price": 30.00
    }
  ],
  "cartTotal": 130.00,
  "discountCode": "ENVIOGRATIS",
  "discountPercent": 15,
  "expirationHours": 24,
  "recoveryLink": "https://tienda.com/cart/recover/cart-123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "html": "<!DOCTYPE html>...",
  "text": "Versión texto plano...",
  "subject": "🛒 Completa tu compra - 2 productos te esperan",
  "note": "Este es un preview. El email NO se ha enviado realmente."
}
```

### 3. Estado de Servicios

```bash
GET /api/v1/agents/abandoned-cart/services-status
```

**Respuesta:**
```json
{
  "whatsapp": {
    "enabled": true,
    "note": "WhatsApp está configurado y listo para enviar mensajes reales"
  },
  "email": {
    "enabled": true,
    "mode": "preview",
    "note": "El servicio de email está en modo preview. Los emails se generan pero NO se envían realmente."
  }
}
```

### 4. Trigger Automático

```bash
POST /api/v1/agents/abandoned-cart/trigger
Content-Type: application/json

{
  "olderThanMinutes": 60  // Opcional, default: 60
}
```

---

## 💡 Cómo Usar en el Frontend

### Ejemplo: Enviar WhatsApp desde el botón "Recuperar"

```typescript
async recoverCart(cartId: string, customerPhone: string) {
  // 1. Generar mensaje de voz con IA (opcional)
  const voiceResult = await this.generateVoiceMessage(cartId);
  
  // 2. Enviar WhatsApp
  const response = await fetch('/api/v1/agents/abandoned-cart/send-whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cartId,
      phoneNumber: customerPhone,
      message: 'Hola! Notamos que dejaste productos en tu carrito.',
      audioUrl: voiceResult.audioUrl, // Opcional
    }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    if (result.isEnabled) {
      alert('✅ WhatsApp enviado exitosamente!');
    } else {
      alert('⚠️ WhatsApp en modo simulación. Configura Twilio para envío real.');
    }
  }
}
```

### Ejemplo: Mostrar Preview de Email

```typescript
async previewEmail(cartId: string) {
  const response = await fetch('/api/v1/agents/abandoned-cart/preview-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cartId,
      customerName: 'Juan Pérez',
      customerEmail: 'juan@example.com',
      cartItems: [
        { name: 'Producto 1', quantity: 2, price: 50.00 },
      ],
      cartTotal: 100.00,
      discountCode: 'ENVIOGRATIS',
      discountPercent: 15,
      expirationHours: 24,
      recoveryLink: `https://tienda.com/cart/recover/${cartId}`,
    }),
  });
  
  const result = await response.json();
  
  // Abrir preview en nueva ventana
  const previewWindow = window.open('', '_blank');
  previewWindow.document.write(result.html);
  previewWindow.document.close();
}
```

---

## 🎯 Flujo Completo de Recuperación

1. **Detección**: El sistema detecta carritos abandonados (más de X minutos)
2. **Generación de Mensaje**: El VoiceAgent genera un mensaje personalizado con IA
3. **Envío WhatsApp**: Se envía el mensaje (con audio si está disponible)
4. **Preview Email**: Se genera el HTML del email (sin enviar)
5. **Seguimiento**: Se registra el intento de recuperación

---

## 🔒 Seguridad y Mejores Prácticas

### WhatsApp
- ✅ Usa el Sandbox de Twilio para desarrollo
- ✅ Valida números de teléfono antes de enviar
- ✅ Implementa rate limiting
- ✅ No expongas las credenciales de Twilio en el frontend

### Email Preview
- ✅ El servicio NO envía emails, solo genera HTML
- ✅ Para producción, considera usar SendGrid/Mailchimp
- ✅ Valida datos de entrada antes de generar preview

---

## 🐛 Troubleshooting

### WhatsApp no envía mensajes
1. Verifica que `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` estén configurados
2. Verifica que el número esté en formato E.164 (`+34612345678`)
3. Verifica que el número esté unido al Sandbox de Twilio
4. Revisa los logs del backend para ver errores específicos

### Email preview no se muestra
1. Verifica que el JSON de entrada sea válido
2. Revisa la consola del navegador para errores
3. Asegúrate de que el HTML se esté escribiendo correctamente en la ventana

---

## 📚 Recursos Adicionales

- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [Twilio Sandbox Setup](https://www.twilio.com/docs/whatsapp/quickstart/node)
- [Formato E.164](https://en.wikipedia.org/wiki/E.164)

---

## ✅ Checklist de Implementación

- [x] Servicio de WhatsApp creado
- [x] Servicio de Email Preview creado
- [x] Endpoints REST implementados
- [x] Integración con VoiceAgent
- [x] Modo simulación cuando Twilio no está configurado
- [ ] Instalar Twilio: `npm install twilio`
- [ ] Configurar variables de entorno
- [ ] Probar envío real de WhatsApp
- [ ] Integrar con frontend

---

**Nota**: El servicio funciona perfectamente en modo simulación sin Twilio. Solo necesitas configurar Twilio si quieres envío real de WhatsApp.


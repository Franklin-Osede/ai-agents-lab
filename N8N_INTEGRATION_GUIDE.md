# 🔌 Guía de Integración con n8n - Booking Agent

## 📋 Estado Actual

### ✅ Lo que Ya Funciona

1. **Endpoint `/chat`** - Compatible con n8n
2. **Formato de respuesta** - Estándar JSON
3. **Memory/conversación** - Multi-turno funcionando

### ⚠️ Mejoras Recientes

1. **Respuesta Mejorada** - Ahora incluye:
   - `bookingStatus`: "pending" | "confirmed" | "cancelled"
   - `bookingId`: ID del booking cuando se confirma
   - `bookingDetails`: date, time, customerName
   - `nextAction`: "send_confirmation" cuando se confirma

2. **Webhook Service** - Creado (falta integrar en confirm-booking)

---

## 🔌 Cómo Integrar con n8n (Paso a Paso)

### Paso 1: Crear Workflow en n8n

1. Abre n8n
2. Crea nuevo workflow
3. Nombre: "AI Booking Agent"

### Paso 2: Configurar Webhook Trigger (Opcional)

**Si quieres que n8n reciba mensajes del cliente:**

```
1. Agregar node "Webhook"
2. Método: POST
3. Path: /webhook/booking
4. Activar workflow
5. Copiar URL: https://tu-n8n.com/webhook/booking
```

**Usar en tu website:**
```javascript
// Cuando cliente envía mensaje, enviar a n8n
fetch('https://tu-n8n.com/webhook/booking', {
  method: 'POST',
  body: JSON.stringify({ message: 'Quiero una cita' })
});
```

### Paso 3: HTTP Request Node - Llamar al AI Agent

**Configuración:**

```
Node: HTTP Request
Method: POST
URL: https://api.agentslab.ai/api/v1/agents/booking/chat
  (o http://localhost:3000/api/v1/agents/booking/chat para desarrollo)

Authentication: Generic Credential Type
  - Header Name: Authorization
  - Header Value: Bearer {{$env.API_KEY}}

Headers:
  Content-Type: application/json

Body (JSON):
{
  "message": "{{$json.body.message}}",
  "sessionId": "{{$json.body.sessionId || $json.body.customerId}}",
  "businessId": "{{$env.BUSINESS_ID || 'default-business'}}"
}
```

**Variables de Entorno en n8n:**
- `API_KEY`: Tu API key (sk_live_xxx)
- `BUSINESS_ID`: ID de tu negocio

### Paso 4: IF Node - Verificar si Booking Confirmado

**Configuración:**

```
Node: IF
Condition: {{$json.bookingStatus}} === "confirmed"
```

**Salida TRUE (confirmado):**
- Continuar con acciones (Calendar, Email, etc.)

**Salida FALSE (pendiente):**
- Retornar respuesta al cliente
- O continuar conversación

### Paso 5: Acciones cuando Booking Confirmado

#### 5.1 Google Calendar - Crear Evento

```
Node: Google Calendar
Operation: Create Event
Calendar ID: tu-calendar-id
Summary: Cita con {{$json.bookingDetails.customerName}}
Start: {{$json.bookingDetails.date}}T{{$json.bookingDetails.time}}
Duration: 1 hour
```

#### 5.2 Email - Confirmación al Cliente

```
Node: Email (Gmail/SendGrid)
To: {{$json.bookingDetails.email}}
Subject: Confirmación de Cita
Body: 
  Hola {{$json.bookingDetails.customerName}},
  
  Tu cita está confirmada para:
  Fecha: {{$json.bookingDetails.date}}
  Hora: {{$json.bookingDetails.time}}
  
  ID de Reserva: {{$json.bookingId}}
```

#### 5.3 CRM - Crear Contacto/Deal

**Para HubSpot:**
```
Node: HubSpot
Operation: Create Contact
Email: {{$json.bookingDetails.email}}
First Name: {{$json.bookingDetails.customerName}}
```

**Para Salesforce:**
```
Node: Salesforce
Operation: Create Lead
Email: {{$json.bookingDetails.email}}
Name: {{$json.bookingDetails.customerName}}
```

#### 5.4 WhatsApp - Recordatorio (Opcional)

```
Node: WhatsApp (Twilio/MessageBird)
To: {{$json.bookingDetails.phone}}
Message: 
  Recordatorio: Tienes una cita mañana a las {{$json.bookingDetails.time}}
```

### Paso 6: Webhook de Salida (Responder al Cliente)

**Si el cliente espera respuesta:**

```
Node: HTTP Request
Method: POST
URL: {{$json.originalRequest.callbackUrl}}
Body:
{
  "response": "{{$json.response}}",
  "bookingStatus": "{{$json.bookingStatus}}"
}
```

---

## 📝 Blueprint n8n Completo (JSON)

**Estructura del Workflow:**

```json
{
  "name": "AI Booking Agent - Complete Flow",
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "name": "Webhook Trigger",
      "parameters": {
        "path": "booking",
        "httpMethod": "POST"
      }
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "name": "AI Booking Agent",
      "parameters": {
        "url": "https://api.agentslab.ai/api/v1/agents/booking/chat",
        "authentication": "genericCredentialType",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{$env.API_KEY}}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "message",
              "value": "={{$json.body.message}}"
            },
            {
              "name": "sessionId",
              "value": "={{$json.body.sessionId}}"
            },
            {
              "name": "businessId",
              "value": "={{$env.BUSINESS_ID}}"
            }
          ]
        }
      }
    },
    {
      "type": "n8n-nodes-base.if",
      "name": "Check Booking Status",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.bookingStatus}}",
              "operation": "equals",
              "value2": "confirmed"
            }
          ]
        }
      }
    },
    {
      "type": "n8n-nodes-base.googleCalendar",
      "name": "Create Calendar Event",
      "parameters": {
        "operation": "create",
        "calendarId": "={{$env.CALENDAR_ID}}",
        "start": "={{$json.bookingDetails.date}}T{{$json.bookingDetails.time}}",
        "end": "={{$json.bookingDetails.date}}T{{$json.bookingDetails.time | addHours(1)}}",
        "summary": "Cita con {{$json.bookingDetails.customerName}}"
      }
    },
    {
      "type": "n8n-nodes-base.emailSend",
      "name": "Send Confirmation Email",
      "parameters": {
        "to": "={{$json.bookingDetails.email}}",
        "subject": "Confirmación de Cita",
        "text": "Tu cita está confirmada para {{$json.bookingDetails.date}} a las {{$json.bookingDetails.time}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{ "node": "AI Booking Agent" }]]
    },
    "AI Booking Agent": {
      "main": [[{ "node": "Check Booking Status" }]]
    },
    "Check Booking Status": {
      "main": [
        [
          { "node": "Create Calendar Event" }
        ],
        []
      ]
    },
    "Create Calendar Event": {
      "main": [[{ "node": "Send Confirmation Email" }]]
    }
  }
}
```

---

## 🎯 Cuándo Implementar n8n

### Opción 1: Ahora (Si Necesitas Rápido)

**Puedes usar n8n YA con:**
- ✅ Endpoint `/chat` funcionando
- ✅ Respuesta mejorada (bookingStatus, bookingId)
- ⚠️ Falta: Webhook automático (puedes hacerlo manual en n8n)

**Workflow básico:**
1. HTTP Request → AI Agent
2. IF → Check bookingStatus
3. Actions → Calendar, Email, etc.

### Opción 2: Después de Mejoras (Recomendado)

**Esperar a:**
- ✅ Webhook automático cuando se confirma
- ✅ Endpoints `/cancel` y `/modify`
- ✅ Mejor manejo de estados

**Cuándo:** Semana 7-8 (como planeado)

---

## 📋 Checklist para n8n Integration

### Preparación

- [ ] API Key generada
- [ ] Business ID configurado
- [ ] Variables de entorno en n8n
- [ ] Endpoint `/chat` probado manualmente

### Workflow Básico

- [ ] HTTP Request node configurado
- [ ] IF node para verificar bookingStatus
- [ ] Acciones cuando confirmado (Calendar, Email)

### Workflow Avanzado

- [ ] Webhook trigger (si recibe mensajes)
- [ ] Integración con CRM
- [ ] Notificaciones automáticas
- [ ] Manejo de errores

### Testing

- [ ] Probar con mensaje simple
- [ ] Probar confirmación de booking
- [ ] Verificar que Calendar se crea
- [ ] Verificar que Email se envía

---

## 🚀 Próximos Pasos

### Esta Semana

1. ✅ Mejorar respuesta `/chat` (bookingStatus, bookingId) - **HECHO**
2. ⏳ Integrar webhook en `confirm-booking.tool.ts`
3. ⏳ Probar workflow básico en n8n

### Próxima Semana

4. ⏳ Crear blueprint JSON completo
5. ⏳ Documentación paso a paso
6. ⏳ Video tutorial

### Semana 7-8

7. ⏳ 5 blueprints completos (uno por agente)
8. ⏳ Página de descarga
9. ⏳ Documentación completa

---

## 💡 Recomendación

**Para empezar con n8n:**

1. **Ahora:** Puedes crear workflow básico con endpoint `/chat`
2. **Esta semana:** Integrar webhook automático
3. **Semana 7-8:** Crear blueprints completos y documentación

**El endpoint ya funciona**, solo necesitas:
- Configurar HTTP Request node en n8n
- Usar la respuesta mejorada (bookingStatus) para tomar decisiones
- Agregar acciones cuando bookingStatus === "confirmed"

---

**Última actualización:** 2024-12-10
**Estado:** ✅ Listo para usar, mejoras en progreso

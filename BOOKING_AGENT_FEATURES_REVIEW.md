# 📋 Revisión de Funcionalidades - Booking Agent

## ✅ Funcionalidades Actuales

### 1. Chat Interface
- ✅ Endpoint `/chat` (n8n compatible)
- ✅ Endpoint `/process` (legacy)
- ✅ LangChain con tools
- ✅ Memory/conversación multi-turno
- ✅ Fallback scripted (si LangChain falla)

### 2. Tools Disponibles
- ✅ `check_availability` - Consultar disponibilidad
- ✅ `suggest_times` - Sugerir horarios
- ✅ `confirm_booking` - Confirmar reserva

### 3. Integración
- ✅ Endpoint compatible con n8n
- ✅ Formato de respuesta estándar
- ⚠️ Falta: Webhook de salida (cuando se confirma)

---

## ⚠️ Funcionalidades Faltantes (Importantes)

### 1. Webhook de Salida (CRÍTICO para n8n)

**Problema:** Cuando se confirma un booking, n8n necesita saberlo para continuar el workflow.

**Solución:** Agregar webhook automático

```typescript
// backend/src/agents/booking-agent/application/services/booking-agent.service.ts

async confirmBooking(bookingId: string, tenantId: string) {
  // ... confirmar booking ...
  
  // Enviar webhook si está configurado
  const tenant = await this.tenantService.findById(tenantId);
  if (tenant.settings.webhookUrl) {
    await this.webhookService.send(tenant.settings.webhookUrl, {
      event: 'booking.confirmed',
      bookingId,
      timestamp: new Date(),
      data: bookingData,
    });
  }
}
```

**Cuándo implementar:** Semana 2-3 (antes de n8n blueprints)

### 2. Estado de Booking en Respuesta

**Problema:** El frontend/n8n necesita saber si el booking está "pending", "confirmed", "cancelled".

**Solución:** Incluir estado en respuesta

```typescript
// Mejorar respuesta del endpoint /chat
{
  "response": "Tu cita está confirmada",
  "bookingStatus": "confirmed", // nuevo
  "bookingId": "booking_123",    // nuevo
  "bookingDetails": {             // nuevo
    "date": "2024-12-15",
    "time": "10:00",
    "service": "Consulta"
  }
}
```

**Cuándo implementar:** Esta semana

### 3. Cancelación/Modificación de Bookings

**Problema:** No hay forma de cancelar o modificar una reserva.

**Solución:** Agregar endpoints

```typescript
@Post('cancel')
async cancelBooking(@Body() body: { bookingId: string }) {
  // Cancelar booking
  // Enviar webhook
}

@Post('modify')
async modifyBooking(@Body() body: { bookingId: string; newDate?: string; newTime?: string }) {
  // Modificar booking
  // Enviar webhook
}
```

**Cuándo implementar:** Semana 3

### 4. Integración con Calendario Real

**Problema:** Actualmente usa `InMemoryBookingRepository` (mock).

**Solución:** Adapter pattern para diferentes calendarios

```typescript
// backend/src/agents/booking-agent/infrastructure/calendars/
- google-calendar.adapter.ts
- outlook-calendar.adapter.ts
- cal.com.adapter.ts
```

**Cuándo implementar:** Semana 4-5 (después de CRMs)

### 5. Notificaciones Automáticas

**Problema:** No hay recordatorios ni confirmaciones automáticas.

**Solución:** Sistema de notificaciones

```typescript
// Cuando se confirma booking:
- Email de confirmación al cliente
- WhatsApp recordatorio (24h antes)
- Email recordatorio al negocio
```

**Cuándo implementar:** Semana 4-5

---

## 🔌 Integración con n8n - Plan Completo

### Paso 1: Endpoint `/chat` (YA EXISTE) ✅

**Formato actual:**
```json
POST /api/v1/agents/booking/chat
{
  "message": "Quiero una cita",
  "sessionId": "session_123",
  "businessId": "biz_456"
}

Response:
{
  "response": "¿Qué fecha te viene bien?"
}
```

**✅ Esto ya funciona con n8n**

### Paso 2: Webhook de Salida (FALTA)

**Necesitamos:** Cuando se confirma booking, enviar webhook

```typescript
// Agregar en confirm-booking.tool.ts
async confirmBooking(...) {
  // ... confirmar ...
  
  // Enviar webhook
  await this.webhookService.send(tenant.webhookUrl, {
    event: 'booking.confirmed',
    booking: { id, date, time, customer }
  });
}
```

**Cuándo:** Semana 2-3

### Paso 3: Blueprint n8n Completo

**Workflow sugerido:**

```
1. Webhook Trigger (mensaje del cliente)
   ↓
2. AI Agent Node (Booking Agent)
   - URL: https://api.agentslab.ai/api/v1/agents/booking/chat
   - API Key: {{$env.API_KEY}}
   ↓
3. IF Node (¿Booking confirmado?)
   - Condición: {{$json.bookingStatus}} === "confirmed"
   ↓
4. Google Calendar Node (Crear evento)
   ↓
5. Email Node (Confirmación al cliente)
   ↓
6. WhatsApp Node (Recordatorio 24h antes)
```

**Cuándo:** Semana 7-8 (después de webhooks)

---

## 📝 Checklist de Mejoras para Booking Agent

### Esta Semana (Crítico)

- [ ] **Agregar `bookingStatus` en respuesta** del endpoint `/chat`
- [ ] **Agregar `bookingId` en respuesta** cuando se confirma
- [ ] **Agregar `bookingDetails`** (date, time, service) en respuesta
- [ ] **Webhook de salida** cuando se confirma booking

### Próxima Semana (Importante)

- [ ] **Endpoint `/cancel`** para cancelar bookings
- [ ] **Endpoint `/modify`** para modificar bookings
- [ ] **Endpoint `/list`** para listar bookings de un cliente
- [ ] **Mejorar manejo de errores** con códigos específicos

### Semana 3-4 (Nice to Have)

- [ ] **Integración Google Calendar** (adapter)
- [ ] **Notificaciones automáticas** (email, WhatsApp)
- [ ] **Recordatorios** (24h antes)
- [ ] **Confirmación por SMS**

---

## 🎯 Recomendación: Qué Hacer Ahora

### Prioridad 1: Mejorar Respuesta del Endpoint `/chat`

**Agregar a la respuesta:**
```typescript
{
  "response": "Tu cita está confirmada",
  "bookingStatus": "confirmed",      // NUEVO
  "bookingId": "booking_123",        // NUEVO
  "bookingDetails": {                // NUEVO
    "date": "2024-12-15",
    "time": "10:00",
    "service": "Consulta",
    "customerName": "María"
  },
  "nextAction": "send_confirmation"  // NUEVO (para n8n)
}
```

**Por qué:** n8n necesita saber el estado para decidir qué hacer después.

### Prioridad 2: Webhook de Salida

**Implementar:**
- Cuando booking se confirma → webhook automático
- Configurable por tenant
- Firma HMAC para seguridad

**Por qué:** n8n necesita ser notificado cuando algo pasa.

### Prioridad 3: Endpoints Adicionales

- `/cancel` - Cancelar booking
- `/modify` - Modificar booking
- `/list` - Listar bookings

**Por qué:** Funcionalidad completa para el negocio.

---

## 🔌 Cómo Integrar con n8n (Paso a Paso)

### Paso 1: Configurar Webhook en n8n

1. Crear workflow en n8n
2. Agregar "Webhook" node como trigger
3. Copiar URL del webhook (ej: `https://tu-n8n.com/webhook/booking`)

### Paso 2: Configurar en Dashboard

1. Ir a dashboard → Booking Agent → Configuración
2. Pegar webhook URL
3. Guardar

### Paso 3: Usar en n8n

**HTTP Request Node:**
```
Method: POST
URL: https://api.agentslab.ai/api/v1/agents/booking/chat
Headers:
  Authorization: Bearer {{$env.API_KEY}}
  Content-Type: application/json
Body:
{
  "message": "{{$json.body.message}}",
  "sessionId": "{{$json.body.sessionId}}",
  "businessId": "{{$env.BUSINESS_ID}}"
}
```

**IF Node (después de AI Agent):**
```
Condition: {{$json.bookingStatus}} === "confirmed"
```

**Acciones (si confirmado):**
- Google Calendar: Crear evento
- Email: Enviar confirmación
- CRM: Crear contacto/deal

---

## 📅 Cuándo Implementar Cada Cosa

### Esta Semana (Semana 1-2)

1. ✅ Seguridad base (COMPLETADO)
2. ✅ Widget JavaScript (COMPLETADO)
3. ⏳ **Mejorar respuesta `/chat`** (agregar bookingStatus, bookingId)
4. ⏳ **Webhook de salida** (cuando se confirma)

### Semana 3

5. ⏳ Endpoints `/cancel` y `/modify`
6. ⏳ WordPress Plugin

### Semana 4

7. ⏳ Zapier Integration
8. ⏳ Notificaciones automáticas

### Semana 7-8

9. ⏳ n8n Blueprints completos
10. ⏳ Documentación n8n

---

## ✅ Conclusión

**Booking Agent está bien, pero necesita:**

1. **Mejorar respuesta** (agregar bookingStatus, bookingId) ← **HACER ESTA SEMANA**
2. **Webhook de salida** ← **HACER ESTA SEMANA**
3. **Endpoints adicionales** (cancel, modify) ← **PRÓXIMA SEMANA**
4. **n8n blueprints** ← **SEMANA 7-8** (cuando me lo digas)

**El endpoint `/chat` ya funciona con n8n**, solo necesita mejoras en la respuesta para que n8n pueda tomar decisiones automáticas.

---

**Última actualización:** 2024-12-10








# 🔌 Guía de Integración con CRM y Base de Datos

## 📋 ¿Cómo Funciona la Integración?

Cuando un cliente prueba el demo y le gusta, necesita conectar el agente con:
1. **Su base de datos** (calendarios, disponibilidad, clientes)
2. **Su CRM** (HubSpot, Salesforce, Pipedrive, etc.)
3. **Sus sistemas** (email, WhatsApp, calendarios)

---

## 🎯 Flujo de Integración para Clientes

### Paso 1: Registro y Configuración Inicial

```
Cliente prueba demo → Le gusta → Se registra → Obtiene API Key
```

**En el Dashboard:**
1. Cliente crea cuenta en AI Agents Lab
2. Elige plan (Starter $29/mes, Pro $49/mes, Enterprise $99/mes)
3. Recibe su **API Key única** (ej: `sk_live_abc123...`)
4. Ve dashboard con opciones de integración

---

### Paso 2: Conectar con Base de Datos

**Opción A: Webhooks (Recomendado para empezar)**

```
Booking confirmado → Webhook → Base de datos del cliente
```

**Configuración:**
1. Cliente configura su webhook URL en el dashboard:
   ```
   https://su-servidor.com/webhook/booking
   ```

2. Cuando se confirma un booking, nuestro sistema envía:
   ```json
   POST https://su-servidor.com/webhook/booking
   {
     "event": "booking.confirmed",
     "bookingId": "BK-12345",
     "date": "2024-12-15",
     "time": "10:00",
     "customerName": "María García",
     "customerEmail": "maria@example.com",
     "service": "Consulta médica",
     "timestamp": "2024-12-10T10:30:00Z"
   }
   ```

3. El servidor del cliente:
   - Guarda en su base de datos
   - Actualiza su calendario
   - Envía confirmación por email
   - Crea contacto en su CRM

**Ventajas:**
- ✅ No necesita exponer su base de datos
- ✅ Control total sobre sus datos
- ✅ Fácil de implementar

---

**Opción B: API Directa (Para clientes técnicos)**

```
Cliente expone API → Nuestro agente consulta directamente
```

**Configuración:**
1. Cliente expone endpoints en su servidor:
   ```
   GET /api/availability?date=2024-12-15
   POST /api/bookings
   GET /api/customers/{id}
   ```

2. Cliente configura en nuestro dashboard:
   ```
   Availability API: https://su-servidor.com/api/availability
   Booking API: https://su-servidor.com/api/bookings
   API Key: su-api-key-secreta
   ```

3. Nuestro agente consulta directamente:
   - `check_availability` → Llama a su API
   - `confirm_booking` → Guarda en su API

**Ventajas:**
- ✅ Integración más profunda
- ✅ Datos en tiempo real
- ✅ Menos latencia

**Desventajas:**
- ⚠️ Cliente debe exponer API pública
- ⚠️ Requiere autenticación robusta

---

### Paso 3: Conectar con CRM

**Método 1: Webhooks Automáticos**

```
Booking confirmado → Webhook → CRM del cliente
```

**Para HubSpot:**
1. Cliente conecta su cuenta HubSpot (OAuth2)
2. Cuando se confirma booking:
   - Creamos contacto en HubSpot
   - Creamos deal/oportunidad
   - Agregamos nota con detalles

**Para Salesforce:**
1. Cliente conecta Salesforce (OAuth2)
2. Cuando se confirma booking:
   - Creamos Lead o Contact
   - Creamos Opportunity
   - Actualizamos campos personalizados

**Para Pipedrive:**
1. Cliente conecta Pipedrive (OAuth2)
2. Cuando se confirma booking:
   - Creamos Person
   - Creamos Deal
   - Agregamos Activity

---

**Método 2: n8n (Automatización Visual)**

```
Booking confirmado → n8n → CRM + Base de datos + Email
```

**Ventajas:**
- ✅ Sin código
- ✅ Visual y fácil
- ✅ Múltiples integraciones a la vez

**Configuración:**
1. Cliente descarga blueprint de n8n desde nuestro dashboard
2. Importa en su n8n
3. Configura:
   - Webhook de nuestro sistema
   - Conexión a su CRM
   - Conexión a su base de datos
   - Email/SMS automáticos

**Ejemplo de Workflow n8n:**
```
1. Webhook (recibe booking confirmado)
   ↓
2. IF (¿tiene email?)
   ↓
3. Crear Contacto en HubSpot
   ↓
4. Crear Deal en HubSpot
   ↓
5. Guardar en Google Sheets
   ↓
6. Enviar Email de confirmación
   ↓
7. Enviar WhatsApp (opcional)
```

---

**Método 3: Zapier (Sin código)**

```
Booking confirmado → Zapier → CRM + Apps
```

**Configuración:**
1. Cliente crea Zap en Zapier
2. Trigger: Webhook de nuestro sistema
3. Actions:
   - Crear contacto en HubSpot
   - Crear evento en Google Calendar
   - Enviar email por Gmail
   - Etc.

---

## 🔐 Seguridad en Integraciones

### Para Webhooks

**HMAC Signature:**
```typescript
// Nuestro sistema envía:
headers: {
  'X-Signature': hmac_sha256(payload, secret_key)
}

// Cliente verifica:
const signature = headers['X-Signature'];
const expected = hmac_sha256(payload, secret_key);
if (signature !== expected) {
  return 401; // Rechazar
}
```

### Para APIs Directas

**OAuth2 o API Keys:**
- Cliente genera API key en su sistema
- La configura en nuestro dashboard
- Nuestro agente usa esa key para autenticarse

**Rate Limiting:**
- Límite de requests por minuto
- Protección contra abuso

---

## 📊 Ejemplo Real: Clínica Médica

### Setup del Cliente

1. **Registro:**
   - Crea cuenta en AI Agents Lab
   - Plan: Starter ($29/mes)
   - Recibe API Key: `sk_live_clinica123`

2. **Conecta Base de Datos:**
   - Tiene sistema propio de citas
   - Configura webhook: `https://clinica.com/api/webhooks/booking`
   - Nuestro sistema envía bookings ahí

3. **Conecta CRM (HubSpot):**
   - Click "Conectar HubSpot" en dashboard
   - Autoriza con OAuth2
   - Automáticamente:
     - Crea contactos cuando hay booking
     - Crea deals para seguimiento
     - Agrega notas con detalles

4. **Integra en su Website:**
   - Copia código JavaScript del widget
   - Lo pega en su WordPress
   - ¡Listo! El agente funciona en su sitio

### Flujo Completo

```
1. Cliente visita clinica.com
   ↓
2. Ve widget de booking
   ↓
3. Chatea con agente: "Quiero cita el viernes"
   ↓
4. Agente verifica disponibilidad (consulta base de datos del cliente)
   ↓
5. Cliente confirma: "Sí, a las 10:00"
   ↓
6. Agente confirma booking
   ↓
7. Nuestro sistema:
   - Envía webhook a clinica.com/api/webhooks/booking
   - Crea contacto en HubSpot
   - Envía email de confirmación
   ↓
8. Sistema del cliente:
   - Guarda en su base de datos
   - Actualiza calendario
   - Envía SMS de recordatorio
```

---

## 🛠️ Implementación Técnica

### En Nuestro Backend

**Webhook Service:**
```typescript
// backend/src/core/integrations/webhook.service.ts
async sendWebhook(url: string, payload: any) {
  const signature = this.generateHMAC(payload);
  
  await this.http.post(url, payload, {
    headers: {
      'X-Signature': signature,
      'X-Event-Type': payload.event,
    }
  });
}
```

**CRM Adapters:**
```typescript
// backend/src/integrations/crm/hubspot.adapter.ts
async createContact(booking: Booking) {
  return this.hubspotClient.contacts.create({
    email: booking.customerEmail,
    firstname: booking.customerName,
    // ...
  });
}
```

### En el Sistema del Cliente

**Webhook Handler:**
```typescript
// Ejemplo en Node.js
app.post('/api/webhooks/booking', async (req, res) => {
  // 1. Verificar signature
  const signature = req.headers['x-signature'];
  if (!verifySignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  // 2. Guardar en base de datos
  await db.bookings.create({
    date: req.body.date,
    time: req.body.time,
    customerName: req.body.customerName,
    // ...
  });
  
  // 3. Actualizar calendario
  await calendar.createEvent({
    title: `Cita con ${req.body.customerName}`,
    start: `${req.body.date}T${req.body.time}`,
  });
  
  // 4. Enviar confirmación
  await emailService.send({
    to: req.body.customerEmail,
    subject: 'Cita confirmada',
    // ...
  });
  
  res.status(200).send('OK');
});
```

---

## 📋 Checklist para Clientes

### Antes de Integrar

- [ ] Tener cuenta en AI Agents Lab
- [ ] Elegir plan (Starter/Pro/Enterprise)
- [ ] Obtener API Key
- [ ] Decidir método de integración (Webhook/API/n8n)

### Para Webhooks

- [ ] Crear endpoint en su servidor
- [ ] Implementar verificación de signature
- [ ] Probar con webhook de prueba
- [ ] Configurar URL en dashboard

### Para CRM

- [ ] Elegir CRM (HubSpot/Salesforce/Pipedrive)
- [ ] Conectar cuenta (OAuth2)
- [ ] Configurar mapeo de campos
- [ ] Probar con booking de prueba

### Para Base de Datos

- [ ] Decidir estructura de datos
- [ ] Crear tablas necesarias
- [ ] Implementar endpoints (si usa API directa)
- [ ] Configurar autenticación

---

## 🚀 Próximos Pasos

1. **Implementar Webhook Service** (Semana 1-2)
   - Enviar webhooks cuando se confirma booking
   - HMAC signature para seguridad

2. **CRM Adapters** (Semana 3-4)
   - HubSpot OAuth2
   - Salesforce OAuth2
   - Pipedrive OAuth2

3. **Dashboard UI** (Semana 4-5)
   - Página de integraciones
   - Botón "Conectar HubSpot"
   - Configuración de webhooks

4. **n8n Blueprints** (Semana 5-6)
   - Blueprint para HubSpot
   - Blueprint para Salesforce
   - Blueprint genérico (webhook → base de datos)

5. **Documentación** (Semana 6)
   - Guías paso a paso
   - Videos tutoriales
   - Ejemplos de código

---

## 💡 Ventajas de Nuestro Enfoque

1. **Flexibilidad:**
   - Cliente elige cómo integrar
   - Webhooks, APIs, n8n, Zapier

2. **Seguridad:**
   - HMAC signatures
   - OAuth2 para CRMs
   - API keys encriptadas

3. **Facilidad:**
   - Dashboard visual
   - Blueprints listos para usar
   - Documentación clara

4. **Escalabilidad:**
   - Funciona con cualquier CRM
   - Compatible con cualquier base de datos
   - Extensible para nuevos sistemas

---

**Última actualización:** 2024-12-10
**Estado:** 📋 Plan de implementación listo

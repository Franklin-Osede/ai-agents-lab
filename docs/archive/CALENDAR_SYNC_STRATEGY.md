# 📅 Estrategia de Sincronización de Calendarios

## 🎯 El Problema

Cuando un cliente compra tu software, necesita que el calendario del agente se sincronice con su agenda real:
- **Doctores**: Sus citas existentes en su sistema
- **Peluquerías**: Horarios de trabajo y citas ya reservadas
- **Restaurantes**: Mesas ocupadas y horarios de servicio
- **Cualquier negocio**: Su sistema de gestión actual

---

## ✅ Soluciones Disponibles

### Opción 1: Webhooks (Recomendado - Más Flexible)

**Cómo funciona:**
```
Cliente tiene su sistema → Expone API/Webhook → Nuestro agente consulta
```

**Ventajas:**
- ✅ Cliente mantiene control total de sus datos
- ✅ Funciona con cualquier sistema (Google Calendar, Calendly, sistemas propios)
- ✅ No necesitas mantener sincronización bidireccional
- ✅ Fácil de implementar

**Implementación:**

1. **Cliente expone endpoint:**
   ```typescript
   // En el sistema del cliente
   GET /api/availability?date=2024-12-15
   Response: {
     "availableSlots": ["10:00", "11:00", "14:00"],
     "busySlots": ["09:00", "13:00", "15:00"]
   }
   ```

2. **Nuestro agente consulta:**
   ```typescript
   // En nuestro check-availability.tool.ts
   async func(input: { date: string }) {
     const clientApiUrl = tenant.settings.calendarApiUrl;
     if (clientApiUrl) {
       const response = await fetch(`${clientApiUrl}?date=${input.date}`);
       const data = await response.json();
       return JSON.stringify({
         available: true,
         date: input.date,
         slots: data.availableSlots,
       });
     }
     // Fallback a mock si no hay API configurada
   }
   ```

3. **Cliente configura en dashboard:**
   ```
   Calendar API URL: https://su-sistema.com/api/availability
   API Key: su-api-key-secreta
   ```

---

### Opción 2: Integración Directa con Google Calendar

**Cómo funciona:**
```
Cliente autoriza Google Calendar → Nuestro sistema lee eventos → Calcula disponibilidad
```

**Ventajas:**
- ✅ Muy común (muchos negocios usan Google Calendar)
- ✅ Sincronización automática
- ✅ No requiere que el cliente exponga API

**Implementación:**

1. **OAuth2 con Google:**
   ```typescript
   // backend/src/integrations/calendar/google-calendar.service.ts
   async getAvailability(tenantId: string, date: Date): Promise<string[]> {
     const tenant = await this.tenantService.findById(tenantId);
     const calendar = await this.getGoogleCalendar(tenant.googleCalendarToken);
     
     const events = await calendar.events.list({
       calendarId: 'primary',
       timeMin: startOfDay(date),
       timeMax: endOfDay(date),
     });
     
     // Calcular slots disponibles
     const busySlots = events.data.items.map(e => e.start.dateTime);
     return this.calculateAvailableSlots(busySlots);
   }
   ```

2. **Cliente autoriza en dashboard:**
   - Click "Conectar Google Calendar"
   - OAuth2 flow
   - Token guardado encriptado

---

### Opción 3: Integración con Calendly/Cal.com

**Cómo funciona:**
```
Cliente usa Calendly → Nuestra API consulta Calendly → Obtiene disponibilidad
```

**Ventajas:**
- ✅ Calendly es muy popular
- ✅ API bien documentada
- ✅ Maneja automáticamente timezones, buffers, etc.

**Implementación:**
```typescript
// backend/src/integrations/calendar/calendly.service.ts
async getAvailability(tenantId: string, date: Date): Promise<string[]> {
  const tenant = await this.tenantService.findById(tenantId);
  const response = await fetch(
    `https://api.calendly.com/event_types/${tenant.calendlyEventTypeId}/available_times`,
    {
      headers: {
        'Authorization': `Bearer ${tenant.calendlyApiKey}`,
      },
    }
  );
  return response.json();
}
```

---

### Opción 4: Servicio de Personalización (Para casos complejos)

**Cuándo ofrecerlo:**
- Cliente tiene sistema muy específico
- Necesita sincronización bidireccional compleja
- Requiere lógica de negocio personalizada

**Cómo funciona:**
1. Cliente contrata servicio de personalización
2. Tu equipo desarrolla integración específica
3. Se cobra como servicio adicional (one-time o mensual)

**Precio sugerido:**
- **One-time**: $500 - $2,000 (dependiendo de complejidad)
- **Mensual**: $50 - $200/mes (mantenimiento y soporte)

---

## 🏗️ Arquitectura Propuesta

### Estructura de Código

```
backend/src/
├── integrations/
│   ├── calendar/
│   │   ├── calendar-adapter.interface.ts
│   │   ├── google-calendar.adapter.ts
│   │   ├── calendly.adapter.ts
│   │   ├── custom-api.adapter.ts
│   │   └── calendar.service.ts
│   └── calendar.module.ts
```

### Interface Común

```typescript
interface ICalendarAdapter {
  getAvailability(tenantId: string, date: Date): Promise<string[]>;
  createBooking(tenantId: string, booking: Booking): Promise<void>;
  cancelBooking(tenantId: string, bookingId: string): Promise<void>;
}
```

### Uso en Booking Agent

```typescript
// check-availability.tool.ts
async func(input: { date: string }) {
  const tenant = await this.tenantService.findById(context.tenantId);
  
  // Si tiene integración de calendario configurada
  if (tenant.calendarAdapter) {
    const adapter = this.calendarService.getAdapter(tenant.calendarAdapter);
    const slots = await adapter.getAvailability(tenant.id, new Date(input.date));
    return JSON.stringify({ available: true, date: input.date, slots });
  }
  
  // Fallback a mock para demos
  return mockAvailability(input.date);
}
```

---

## 📋 Plan de Implementación

### Fase 1: Webhooks/Custom API (Semana 1-2)

**Objetivo:** Permitir que clientes conecten su propio sistema

**Tareas:**
- [ ] Crear `CalendarAdapter` interface
- [ ] Implementar `CustomApiAdapter` (consulta API del cliente)
- [ ] Agregar campo `calendarApiUrl` en Tenant settings
- [ ] Modificar `check-availability.tool.ts` para usar adapter
- [ ] UI en dashboard para configurar API URL

**Resultado:** Clientes pueden conectar su sistema propio

---

### Fase 2: Google Calendar (Semana 3-4)

**Objetivo:** Integración nativa con Google Calendar

**Tareas:**
- [ ] Implementar OAuth2 flow para Google
- [ ] Crear `GoogleCalendarAdapter`
- [ ] Agregar botón "Conectar Google Calendar" en dashboard
- [ ] Manejar refresh tokens
- [ ] Testing con calendarios reales

**Resultado:** Clientes pueden usar Google Calendar directamente

---

### Fase 3: Calendly/Cal.com (Semana 5-6)

**Objetivo:** Integración con plataformas populares

**Tareas:**
- [ ] Implementar `CalendlyAdapter`
- [ ] Implementar `CalComAdapter` (opcional)
- [ ] UI para configurar
- [ ] Documentación

**Resultado:** Soporte para plataformas populares

---

### Fase 4: Servicio de Personalización (Ongoing)

**Objetivo:** Ofrecer desarrollo personalizado

**Tareas:**
- [ ] Crear página de servicios
- [ ] Proceso de cotización
- [ ] Template de contrato
- [ ] Proceso de desarrollo

**Resultado:** Revenue adicional por personalizaciones

---

## 💰 Modelo de Precios Sugerido

### Planes Base (sin incluir calendario)

- **Starter**: $29/mes - Sin integración de calendario (solo mock)
- **Pro**: $49/mes - Incluye 1 integración de calendario (Google, Calendly, o Custom API)
- **Enterprise**: $99/mes - Incluye todas las integraciones + soporte prioritario

### Servicios Adicionales

- **Personalización de Calendario**: $500 - $2,000 (one-time)
- **Mantenimiento de Integración**: $50 - $200/mes
- **Soporte Técnico Premium**: $100/mes

---

## 🎯 Recomendación Estratégica

### Para Empezar (MVP):

1. **Webhooks/Custom API** (Fase 1)
   - ✅ Más flexible
   - ✅ Funciona con cualquier sistema
   - ✅ Cliente mantiene control
   - ✅ Más fácil de implementar

2. **Google Calendar** (Fase 2)
   - ✅ Muy común
   - ✅ Diferenciador competitivo
   - ✅ Atractivo para clientes

### Para el Futuro:

3. **Calendly** (Fase 3)
   - ✅ Popular en ciertos nichos
   - ✅ API robusta

4. **Servicio de Personalización**
   - ✅ Revenue adicional
   - ✅ Para casos edge

---

## 📝 Ejemplo Real: Clínica Médica

### Escenario:
Clínica usa sistema propio de gestión (no Google Calendar, no Calendly)

### Solución 1: Custom API (Recomendado)
1. Clínica expone endpoint: `https://clinica.com/api/availability`
2. Configura en dashboard: URL + API Key
3. Nuestro agente consulta antes de mostrar slots
4. ✅ Funciona inmediatamente

### Solución 2: Servicio de Personalización
1. Clínica contrata servicio ($1,000)
2. Tu equipo desarrolla integración específica
3. Se conecta directamente a su base de datos
4. ✅ Integración más profunda, pero más costosa

---

## 🔐 Consideraciones de Seguridad

### Para Custom API:
- ✅ API Key encriptada
- ✅ HTTPS obligatorio
- ✅ Rate limiting
- ✅ Validación de respuestas

### Para Google Calendar:
- ✅ OAuth2 (tokens encriptados)
- ✅ Scope mínimo necesario
- ✅ Refresh tokens automáticos
- ✅ Revocación de acceso

---

## 📊 Comparación de Opciones

| Opción | Complejidad | Tiempo | Costo Cliente | Flexibilidad |
|--------|-------------|--------|---------------|--------------|
| **Webhooks/Custom API** | Baja | 1-2 semanas | Gratis (incluido) | ⭐⭐⭐⭐⭐ |
| **Google Calendar** | Media | 3-4 semanas | Gratis (Pro+) | ⭐⭐⭐⭐ |
| **Calendly** | Media | 2-3 semanas | Gratis (Pro+) | ⭐⭐⭐ |
| **Personalización** | Alta | Variable | $500-$2,000 | ⭐⭐⭐⭐⭐ |

---

## 🚀 Próximos Pasos Inmediatos

1. **Implementar Custom API Adapter** (Esta semana)
   - Permitir que clientes configuren su API URL
   - Modificar `check-availability.tool.ts`

2. **Documentar para clientes**
   - Guía de cómo exponer su API
   - Ejemplos de código
   - Formato esperado de respuesta

3. **UI en Dashboard**
   - Sección "Integraciones"
   - Campo para API URL
   - Botón de prueba

---

**Última actualización:** 2024-12-10
**Estado:** 📋 Plan listo para implementación












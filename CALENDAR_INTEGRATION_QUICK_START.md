# 🚀 Inicio Rápido: Integración de Calendarios

## 📋 Respuesta a tu Pregunta

**Pregunta:** "Cuando compren el software, ¿cómo sincronizan el calendario con la agenda real de los doctores? ¿Deberíamos ofrecerlo como servicio de personalización?"

**Respuesta:** **SÍ, pero con múltiples opciones según el cliente.**

---

## 🎯 3 Opciones para Clientes

### Opción 1: Webhooks/Custom API (Recomendado - 80% de casos)

**Para quién:** Clientes con sistema propio (clínicas, peluquerías, etc.)

**Cómo funciona:**
1. Cliente expone un endpoint en su sistema
2. Nuestro agente consulta ese endpoint cuando necesita disponibilidad
3. Cliente mantiene control total

**Ejemplo:**
```typescript
// Sistema del cliente expone:
GET https://clinica.com/api/availability?date=2024-12-15
Response: {
  "availableSlots": ["10:00", "11:00", "14:00"],
  "busySlots": ["09:00", "13:00"]
}
```

**Ventajas:**
- ✅ Cliente no necesita cambiar su sistema
- ✅ Funciona con cualquier base de datos
- ✅ Más seguro (cliente controla acceso)
- ✅ Incluido en plan Pro/Enterprise

**Configuración en Dashboard:**
```
[Integraciones] → [Calendario]
API URL: https://su-sistema.com/api/availability
API Key: [cliente ingresa su key]
[Probar Conexión] ✅
```

---

### Opción 2: Google Calendar (Para muchos clientes)

**Para quién:** Clientes que usan Google Calendar

**Cómo funciona:**
1. Cliente hace click "Conectar Google Calendar"
2. Autoriza con OAuth2
3. Nuestro sistema lee eventos de Google Calendar
4. Calcula disponibilidad automáticamente

**Ventajas:**
- ✅ Muy común (muchos doctores usan Google Calendar)
- ✅ Sincronización automática
- ✅ No requiere que cliente exponga API
- ✅ Incluido en plan Pro/Enterprise

---

### Opción 3: Servicio de Personalización (Para casos complejos)

**Para quién:** 
- Sistemas muy específicos
- Necesitan sincronización bidireccional compleja
- Requieren lógica de negocio personalizada

**Cómo funciona:**
1. Cliente contrata servicio ($500-$2,000)
2. Tu equipo desarrolla integración específica
3. Se conecta directamente a su base de datos/sistema

**Ejemplo:**
```
Clínica tiene sistema propio muy complejo:
- Múltiples doctores
- Diferentes tipos de citas (consulta, seguimiento, emergencia)
- Reglas de negocio específicas (buffer entre citas, etc.)

→ Contratan personalización
→ Tu equipo desarrolla integración específica
→ Funciona perfectamente con su sistema
```

**Precio sugerido:**
- **One-time**: $500 - $2,000 (dependiendo de complejidad)
- **Mensual (opcional)**: $50 - $200/mes (mantenimiento)

---

## 💡 Recomendación Estratégica

### Para Empezar (MVP):

1. **Webhooks/Custom API** (Implementar primero)
   - ✅ Cubre 80% de casos
   - ✅ Más flexible
   - ✅ Cliente mantiene control
   - ✅ Fácil de implementar

2. **Google Calendar** (Segundo)
   - ✅ Muy común
   - ✅ Diferenciador competitivo
   - ✅ Atractivo para clientes

### Para el Futuro:

3. **Servicio de Personalización**
   - ✅ Revenue adicional
   - ✅ Para casos edge (20% de clientes)
   - ✅ Puedes cobrar premium

---

## 🏗️ Implementación Técnica Rápida

### Paso 1: Modificar `check-availability.tool.ts`

```typescript
// backend/src/agents/booking-agent/application/tools/check-availability.tool.ts
func: async (input: any) => {
  const { date } = input as { date: string };
  
  // Si tenant tiene calendar API configurada
  const tenant = await this.tenantService.findById(context.tenantId);
  if (tenant?.settings?.calendarApiUrl) {
    try {
      const response = await fetch(
        `${tenant.settings.calendarApiUrl}?date=${date}`,
        {
          headers: {
            'Authorization': `Bearer ${tenant.settings.calendarApiKey}`,
          },
        }
      );
      const data = await response.json();
      return JSON.stringify({
        available: true,
        date,
        slots: data.availableSlots || [],
      });
    } catch (error) {
      // Fallback a mock si falla
      console.warn('Calendar API failed, using mock:', error);
    }
  }
  
  // Fallback a mock para demos
  return mockAvailability(date);
}
```

### Paso 2: Agregar campos a Tenant Entity

```typescript
// backend/src/core/security/tenant.entity.ts
export class Tenant {
  // ... existing fields
  
  settings: {
    calendarApiUrl?: string;
    calendarApiKey?: string;
    calendarType?: 'custom' | 'google' | 'calendly';
    googleCalendarToken?: string; // Encriptado
  };
}
```

### Paso 3: UI en Dashboard

```html
<!-- frontend: Dashboard → Integraciones → Calendario -->
<div class="calendar-integration">
  <h3>Conectar Calendario</h3>
  
  <!-- Opción 1: Custom API -->
  <div class="integration-option">
    <h4>API Personalizada</h4>
    <input 
      type="url" 
      placeholder="https://tu-sistema.com/api/availability"
      [(ngModel)]="calendarApiUrl">
    <input 
      type="password" 
      placeholder="API Key"
      [(ngModel)]="calendarApiKey">
    <button (click)="testCalendarConnection()">Probar Conexión</button>
  </div>
  
  <!-- Opción 2: Google Calendar -->
  <div class="integration-option">
    <h4>Google Calendar</h4>
    <button (click)="connectGoogleCalendar()">
      Conectar Google Calendar
    </button>
  </div>
  
  <!-- Opción 3: Servicio Personalizado -->
  <div class="integration-option">
    <h4>¿Necesitas algo más complejo?</h4>
    <p>Ofrecemos servicios de personalización</p>
    <button (click)="contactSales()">Contactar Ventas</button>
  </div>
</div>
```

---

## 📊 Comparación Rápida

| Opción | Complejidad | Tiempo Dev | Costo Cliente | % Clientes |
|--------|-------------|------------|---------------|------------|
| **Custom API** | Baja | 1 semana | Gratis (Pro+) | 60% |
| **Google Calendar** | Media | 2 semanas | Gratis (Pro+) | 30% |
| **Personalización** | Alta | Variable | $500-$2,000 | 10% |

---

## 🎯 Respuesta Directa

**¿Deberías ofrecerlo como servicio de personalización?**

**SÍ, pero:**

1. **Para la mayoría (80-90%):** 
   - Ofrece Custom API o Google Calendar
   - Incluido en plan Pro/Enterprise
   - Cliente configura en dashboard

2. **Para casos complejos (10-20%):**
   - Ofrece servicio de personalización
   - Cobra $500-$2,000 one-time
   - Tu equipo desarrolla integración específica

**Estrategia:**
- ✅ Empieza con Custom API (cubre mayoría)
- ✅ Agrega Google Calendar (atractivo)
- ✅ Ofrece personalización como premium (revenue adicional)

---

## 🚀 Próximos Pasos

1. **Esta semana:** Implementar Custom API adapter
2. **Próxima semana:** Agregar Google Calendar
3. **Ongoing:** Ofrecer personalización cuando clientes la necesiten

---

**Última actualización:** 2024-12-10
**Estado:** ✅ Listo para implementar

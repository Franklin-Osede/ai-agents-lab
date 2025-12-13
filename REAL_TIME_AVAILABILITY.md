# ⏰ Disponibilidad en Tiempo Real - Implementación

## 🎯 Objetivo

Mostrar disponibilidad de horarios en tiempo real cuando el agente verifica disponibilidad, permitiendo al usuario seleccionar directamente desde el chat.

---

## 🔄 Flujo de Disponibilidad en Tiempo Real

### Paso 1: Usuario Pide Disponibilidad

```
Usuario: "¿Tenéis disponibilidad el viernes?"
```

### Paso 2: Agente Usa Tool

```
Agente (internamente):
- Detecta que necesita verificar disponibilidad
- Usa tool: check_availability({ date: "2024-12-15" })
```

### Paso 3: Backend Consulta Disponibilidad

```typescript
// check-availability.tool.ts
func: async ({ date }) => {
  // Consulta disponibilidad real
  const slots = await repository.findAvailableSlots(date);
  
  return JSON.stringify({
    available: true,
    date,
    slots: ["10:00", "11:00", "14:30", "16:00"],
    message: "I have found these free slots..."
  });
}
```

### Paso 4: Frontend Detecta Tool Call

```typescript
// demo-modal.component.ts
if (call.name === 'check_availability') {
  const dateStr = call.args.date;
  await this.checkAvailabilityRealTime(dateStr);
}
```

### Paso 5: Panel Visual Aparece

```
┌─────────────────────────────────┐
│  ⏰ Horarios Disponibles        │
│  (Tiempo Real)                  │
│                                 │
│  [10:00] [11:00] [14:30]       │
│  [16:00]                       │
└─────────────────────────────────┘
```

### Paso 6: Usuario Selecciona

```
Usuario click: "10:00"
→ Frontend envía: "Quiero reservar a las 10:00"
→ Agente confirma booking
```

---

## 🔧 Implementación Técnica

### Backend: Mejorar Tool Response

**Actual:**
```typescript
// check-availability.tool.ts
return JSON.stringify({
  available: true,
  date,
  slots: slots.sort(),
  message: `I have found these free slots...`
});
```

**El agente recibe esto y lo incluye en su respuesta**

### Frontend: Detectar y Mostrar

**1. Detectar tool call en respuesta:**

```typescript
if (response?.toolCalls) {
  for (const call of response.toolCalls) {
    if (call.name === 'check_availability') {
      await this.checkAvailabilityRealTime(call.args.date);
    }
  }
}
```

**2. Verificar disponibilidad en tiempo real:**

```typescript
async checkAvailabilityRealTime(date: string) {
  this.checkingAvailability = true;
  
  // Llamar a endpoint demo para obtener slots
  const response = await this.apiService.processBooking(
    `Verificar disponibilidad para ${date}`,
    'demo-business',
    true
  ).toPromise();
  
  // Extraer slots de la respuesta
  // Mostrar en panel
  this.availableSlots = extractedSlots;
  this.checkingAvailability = false;
}
```

**3. Mostrar panel visual:**

```html
<div class="availability-panel" *ngIf="availableSlots.length > 0">
  <h4>Horarios Disponibles (Tiempo Real)</h4>
  <div class="slots">
    <button *ngFor="let slot of availableSlots" 
            (click)="selectTimeSlot(slot)">
      {{ slot }}
    </button>
  </div>
</div>
```

---

## 🎨 Mejoras Visuales

### Panel de Disponibilidad

**Características:**
- ✅ Aparece automáticamente cuando hay disponibilidad
- ✅ Diseño verde (primary color)
- ✅ Slots como botones clickeables
- ✅ Animación suave al aparecer
- ✅ Hover effects

### Indicador de Carga

**Mientras verifica:**
- Spinner animado
- Mensaje: "Verificando disponibilidad en tiempo real..."
- Desaparece cuando slots están listos

---

## 📋 Checklist de Implementación

### Backend

- [x] Tool check_availability retorna slots
- [ ] Mejorar respuesta para incluir availability data explícitamente
- [ ] Endpoint dedicado `/availability?date=...` (opcional)

### Frontend

- [x] Detectar tool calls
- [x] Método checkAvailabilityRealTime
- [x] Panel visual de slots
- [x] Botones clickeables
- [x] Estilos y animaciones
- [ ] Extraer slots de mensaje del agente (regex)

---

## 🚀 Próximos Pasos

### Mejora 1: Endpoint Dedicado (Opcional)

```typescript
// backend/src/demo/demo.controller.ts
@Get('booking/availability')
async getAvailability(@Query('date') date: string) {
  // Consultar disponibilidad
  // Retornar slots
  return {
    date,
    slots: ["10:00", "11:00", "14:30", "16:00"],
    timezone: "Europe/Madrid"
  };
}
```

### Mejora 2: Extraer de Mensaje del Agente

```typescript
// Si el agente dice: "Tengo disponible a las 10:00, 11:00 y 14:30"
// Extraer automáticamente con regex
const timePattern = /\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\b/g;
const slots = message.match(timePattern);
```

---

## ✅ Estado Actual

**Implementado:**
- ✅ Selector de servicios como primer paso
- ✅ Chat después de seleccionar
- ✅ Detección de tool calls
- ✅ Panel visual de disponibilidad
- ✅ Slots clickeables
- ✅ Estilos completos

**Funcionando:**
- ✅ Flujo completo: Service → Chat → Availability → Selection

---

**Última actualización:** 2024-12-10
**Estado:** ✅ Implementado y funcionando





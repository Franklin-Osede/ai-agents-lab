# 💬 Flujo de Conversación Natural por Servicio

## 🎯 Objetivo

Crear conversaciones naturales y contextuales según el servicio seleccionado, con un flujo que incluya:
1. Diálogo natural inicial
2. Verificación de disponibilidad
3. Mostrar calendario
4. Selección de profesional
5. Confirmación

---

## 🗣️ Tono y Contexto por Servicio

### 1. Salud (Clínica Médica)

**Tono:** Profesional y empático

**Mensaje inicial:**
```
👋 ¡Hola! Bienvenido a nuestra clínica. ¿En qué puedo ayudarte hoy? 
¿Te gustaría reservar una consulta médica?
```

**Ejemplos de respuesta del usuario:**
- "Sí, me gustaría una consulta"
- "Necesito ver a un médico"
- "¿Tienen disponibilidad esta semana?"

**Contexto del negocio:**
- Tipo: Clínica médica
- Servicios: Consultas, exámenes, seguimientos
- Urgencia: Puede ser urgente

---

### 2. Belleza (Salón de Belleza)

**Tono:** Amigable y acogedor

**Mensaje inicial:**
```
💅 ¡Hola! Bienvenida a nuestro salón de belleza. ¿Te gustaría agendar 
una cita para algún tratamiento?
```

**Ejemplos de respuesta:**
- "Sí, quiero un corte de pelo"
- "Me gustaría una manicura"
- "¿Qué servicios tienen disponibles?"

**Contexto del negocio:**
- Tipo: Salón de belleza
- Servicios: Corte, color, manicura, tratamientos
- Ambiente: Relajado y social

---

### 3. Dentista (Clínica Dental)

**Tono:** Profesional y tranquilizador

**Mensaje inicial:**
```
🦷 ¡Hola! Bienvenido a nuestra clínica dental. ¿Necesitas agendar una 
cita para una consulta o limpieza?
```

**Ejemplos de respuesta:**
- "Sí, necesito una limpieza"
- "Quiero una consulta"
- "¿Cuándo tienen disponibilidad?"

**Contexto del negocio:**
- Tipo: Clínica dental
- Servicios: Limpiezas, consultas, tratamientos
- Nota: Algunos pacientes pueden tener ansiedad

---

### 4. Restaurante

**Tono:** Cordial y profesional

**Mensaje inicial:**
```
🍽️ ¡Hola! Bienvenido a nuestro restaurante. ¿Te gustaría hacer una 
reserva para alguna fecha?
```

**Ejemplos de respuesta:**
- "Sí, quiero reservar una mesa"
- "Para mañana por la noche"
- "¿Tienen disponibilidad este fin de semana?"

**Contexto del negocio:**
- Tipo: Restaurante
- Servicios: Reservas de mesa, eventos
- Consideraciones: Número de personas, ocasión especial

---

### 5. Fitness (Gimnasio)

**Tono:** Motivador y energético

**Mensaje inicial:**
```
💪 ¡Hola! Bienvenido a nuestro gimnasio. ¿Te gustaría reservar una clase 
o sesión con un entrenador?
```

**Ejemplos de respuesta:**
- "Sí, quiero una clase"
- "Me gustaría un entrenador personal"
- "¿Qué horarios tienen disponibles?"

**Contexto del negocio:**
- Tipo: Gimnasio
- Servicios: Clases, entrenadores, equipos
- Ambiente: Dinámico y motivador

---

## 🔄 Flujo Completo

### Paso 1: Selección de Servicio

```
Usuario selecciona: "Salud"
↓
Modal muestra Service Selector
↓
Usuario click en "Salud"
```

### Paso 2: Conversación Natural

```
Agente: "👋 ¡Hola! Bienvenido a nuestra clínica. ¿En qué puedo ayudarte hoy? 
         ¿Te gustaría reservar una consulta médica?"

Usuario: "Sí, me gustaría una consulta"

Agente: "Perfecto. ¿Para cuándo te gustaría agendar la cita?"

Usuario: "Para esta semana"

Agente: "Déjame verificar la disponibilidad..."
```

### Paso 3: Verificación de Disponibilidad

```
Agente usa tool: check_availability
↓
Backend retorna slots disponibles
↓
Frontend muestra panel de disponibilidad
↓
Opcional: Mostrar calendario (step 2)
```

### Paso 4: Selección de Fecha/Hora

```
Usuario ve calendario con slots disponibles
↓
Usuario selecciona fecha y hora
↓
Agente: "Perfecto, tienes una cita el [fecha] a las [hora]"
```

### Paso 5: Selección de Profesional

```
Agente: "¿Con qué profesional te gustaría tener la consulta?"
↓
Modal muestra lista de profesionales (step 3)
↓
Usuario selecciona profesional
```

### Paso 6: Confirmación

```
Agente: "Excelente. Tu cita está confirmada:
         - Fecha: [fecha]
         - Hora: [hora]
         - Profesional: [nombre]
         ¿Hay algo más en lo que pueda ayudarte?"
```

---

## 🔧 Implementación Técnica

### Frontend: Service Context

```typescript
private getServiceContext(serviceName?: string): any {
  const contexts = {
    'salud': {
      welcomeMessage: '👋 ¡Hola! Bienvenido a nuestra clínica...',
      tone: 'profesional y empático',
      businessType: 'clínica médica',
    },
    // ... otros servicios
  };
  
  return contexts[serviceName] || contexts['salud'];
}
```

### Backend: Context-Aware Responses

```typescript
// En booking-agent-chain.service.ts
async processRequest(message: string, context: {
  businessId: string;
  customerId: string;
  serviceContext?: {
    businessType: string;
    tone: string;
  };
}): Promise<string> {
  // Usar serviceContext para personalizar system prompt
  const systemPrompt = context.serviceContext
    ? `Eres un asistente de reservas para ${context.serviceContext.businessType}. 
       Mantén un tono ${context.serviceContext.tone}.`
    : defaultSystemPrompt;
  
  // ... resto del código
}
```

---

## ✅ Cambios Realizados

1. ✅ Servicios actualizados:
   - Salud → Clínica médica
   - Belleza → Salón de belleza
   - Automóvil → Dentista
   - Hogar → Restaurante
   - Mascotas → Fitness

2. ✅ Mensajes de bienvenida contextuales
3. ✅ Contexto por servicio (tono, tipo de negocio)
4. ✅ Flujo mejorado: Chat → Calendario → Profesional → Confirmación
5. ✅ Service context enviado al backend

---

## 🧪 Cómo Probar

1. Click "Probar Demo" → Booking Agent
2. Seleccionar "Salud"
3. Ver mensaje: "Bienvenido a nuestra clínica..."
4. Responder: "Sí, me gustaría una consulta"
5. Agente pregunta: "¿Para cuándo?"
6. Responder: "Para esta semana"
7. Ver calendario con disponibilidad
8. Seleccionar fecha/hora
9. Ver selección de profesionales
10. Confirmar reserva

---

**Última actualización:** 2024-12-10
**Estado:** ✅ Implementado








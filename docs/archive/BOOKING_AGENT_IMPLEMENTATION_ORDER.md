# 📋 Orden de Implementación - Booking Agent RAC

## ✅ Lo que YA tienes con LangChain

### **Infraestructura LangChain:**
- ✅ `LangChainProvider` - LLM configurado
- ✅ `BookingAgentChainService` - ReAct agent funcionando
- ✅ `InMemoryChatMessageHistory` - Memory multi-turno
- ✅ System prompt personalizado por tipo de negocio

### **Tools Actuales (3):**
1. ✅ `check_availability` - Consulta disponibilidad
2. ✅ `suggest_times` - Sugiere horarios
3. ✅ `confirm_booking` - Confirma reserva

---

## 🚀 Funcionalidades a Implementar (Orden Priorizado)

### **FASE 1: Knowledge Base Básica (2-3 días)** ⭐⭐⭐⭐⭐
**Prioridad: ALTA - Base para todo lo demás**

#### **1.1 Crear Knowledge Base Estructurada**
**Archivos:**
```
backend/src/agents/booking-agent/
├── domain/
│   └── knowledge/
│       └── physio-knowledge.ts          # JSON con datos
└── application/
    └── services/
        └── physio-knowledge.service.ts  # Servicio de acceso
```

**Implementación:**
```typescript
// physio-knowledge.ts
export const PHYSIO_KNOWLEDGE = {
  lumbar: {
    commonInjuries: [
      {
        name: 'Lumbalgia',
        symptoms: ['Dolor zona baja', 'Rigidez matutina', 'Dificultad doblarse'],
        typicalDuration: '2-6 semanas',
        recommendedSessions: 6-8,
        disclaimer: 'Información orientativa. Consulta profesional requerida.'
      },
      // ... más lesiones
    ]
  },
  // ... más partes del cuerpo
};
```

**Por qué primero:**
- Es la base de todas las demás funcionalidades
- Sin esto, el agente no puede dar información contextual
- Es simple (solo datos estructurados)

---

#### **1.2 Crear Tool: `check_injury_info`**
**Archivo:** `backend/src/agents/booking-agent/application/tools/check-injury-info.tool.ts`

**Implementación:**
```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { PhysioKnowledgeService } from '../services/physio-knowledge.service';

export const createCheckInjuryInfoTool = (knowledgeService: PhysioKnowledgeService) => {
  return new DynamicStructuredTool({
    name: 'check_injury_info',
    description: 'Obtiene información sobre lesiones comunes y síntomas para una parte del cuerpo. Usa esto cuando el cliente selecciona una parte del cuerpo o menciona dolor.',
    schema: z.object({
      bodyPart: z.string().describe('Parte del cuerpo: lumbar, neck, shoulders, etc.'),
    }),
    func: async (input: { bodyPart: string }) => {
      const info = await knowledgeService.getInjuryInfo(input.bodyPart);
      return JSON.stringify({
        bodyPart: input.bodyPart,
        commonInjuries: info.commonInjuries,
        typicalSymptoms: info.typicalSymptoms,
        disclaimer: 'Esta información es orientativa y no sustituye una consulta profesional.',
      });
    },
  });
};
```

**Integración en LangChain:**
```typescript
// booking-agent-chain.service.ts
const tools = [
  checkAvailabilityTool,
  this.suggestTimesTool.getTool(),
  confirmBookingTool,
  createCheckInjuryInfoTool(this.physioKnowledgeService), // NUEVO
];
```

**Por qué segundo:**
- Conecta la knowledge base con el agente
- Permite que el agente use la información automáticamente
- Es una extensión natural de lo que ya tienes

---

### **FASE 2: Sugerencias Inteligentes (1-2 días)** ⭐⭐⭐⭐
**Prioridad: ALTA - Muestra valor inmediato**

#### **2.1 Crear Tool: `suggest_treatment`**
**Archivo:** `backend/src/agents/booking-agent/application/tools/suggest-treatment.tool.ts`

**Implementación:**
```typescript
export const createSuggestTreatmentTool = (knowledgeService: PhysioKnowledgeService) => {
  return new DynamicStructuredTool({
    name: 'suggest_treatment',
    description: 'Sugiere tratamiento basado en parte del cuerpo y síntomas. Usa esto después de obtener información de lesiones.',
    schema: z.object({
      bodyPart: z.string(),
      symptoms: z.array(z.string()).optional(),
    }),
    func: async (input: { bodyPart: string; symptoms?: string[] }) => {
      const suggestion = await knowledgeService.suggestTreatment(
        input.bodyPart,
        input.symptoms || []
      );
      return JSON.stringify({
        treatmentType: suggestion.type,
        sessions: suggestion.sessions,
        duration: suggestion.duration,
        priceRange: suggestion.priceRange,
        disclaimer: 'Precios aproximados. Confirmar con profesional.',
      });
    },
  });
};
```

**Integración:**
```typescript
const tools = [
  // ... anteriores
  createSuggestTreatmentTool(this.physioKnowledgeService), // NUEVO
];
```

**Por qué tercero:**
- Usa la knowledge base creada en Fase 1
- Muestra valor inmediato (sugerencias automáticas)
- Aumenta conversión

---

### **FASE 3: Preguntas Contextuales (1 día)** ⭐⭐⭐
**Prioridad: MEDIA - Mejora UX pero no crítico**

#### **3.1 Mejorar System Prompt con Preguntas Contextuales**
**Archivo:** `backend/src/agents/booking-agent/application/services/booking-agent-chain.service.ts`

**Implementación:**
```typescript
// Agregar al system prompt
const contextualQuestions = {
  lumbar: [
    "¿Cuándo comenzó el dolor?",
    "¿Es constante o aparece con ciertos movimientos?",
    "¿El dolor se irradia hacia las piernas?",
  ],
  neck: [
    "¿Sientes rigidez al mover el cuello?",
    "¿El dolor empeora con el trabajo en computadora?",
  ],
  // ... más
};

const systemPrompt = `...
ESPECIALIZACIÓN EN FISIOTERAPIA:
- Cuando el cliente selecciona una parte del cuerpo, usa check_injury_info
- Haz preguntas contextuales basadas en la parte del cuerpo
- Usa estas preguntas como guía: ${JSON.stringify(contextualQuestions)}
...`;
```

**Por qué cuarto:**
- No requiere nueva tool
- Solo mejora el prompt existente
- Mejora la calidad de la conversación

---

### **FASE 4: Historial del Paciente** ⚠️ **POSTPONED - No Prioridad Inicial**
**Razón:** Al principio no habrá muchos usuarios recurrentes, no necesitas esta funcionalidad todavía.

**Cuándo implementar:**
- Cuando tengas usuarios recurrentes reales
- Cuando quieras mostrar personalización avanzada
- Cuando la base de datos sea necesaria

**Por ahora:** ❌ **NO implementar**

---

### **FASE 5: Métricas y ROI** ⚠️ **POSTPONED - No Prioridad Inicial**
**Razón:** No necesitas bases de datos complejas al principio. Las métricas pueden ser simples (contadores en memoria) si las necesitas.

**Alternativa Simple (Si necesitas métricas básicas):**
```typescript
// Métricas simples en memoria (sin base de datos)
class SimpleMetrics {
  private conversations = 0;
  private bookings = 0;
  
  trackConversation() { this.conversations++; }
  trackBooking() { this.bookings++; }
  
  getConversionRate() {
    return this.conversations > 0 
      ? (this.bookings / this.conversations) * 100 
      : 0;
  }
}
```

**Cuándo implementar métricas completas:**
- Cuando tengas usuarios reales
- Cuando necesites persistencia
- Cuando quieras mostrar ROI detallado

**Por ahora:** ❌ **NO implementar métricas complejas**

---

### **FASE 6: RAG con pgvector (OPCIONAL - 3-4 días)** ⭐⭐⭐
**Prioridad: BAJA - Nice to have**

#### **6.1 Setup pgvector en PostgreSQL**
#### **6.2 Crear Entity con Embeddings**
#### **6.3 Crear Tool: `search_treatment_knowledge`**

**Por qué último:**
- Más complejo
- Requiere embeddings (coste adicional)
- Puede ser over-engineering si la knowledge base simple funciona

---

## 📊 Resumen del Orden (Actualizado - Sin Historial ni Métricas)

| Fase | Funcionalidad | Días | Prioridad | Depende de |
|------|---------------|------|-----------|------------|
| 1.1 | Knowledge Base | 1 | ⭐⭐⭐⭐⭐ | - |
| 1.2 | Tool: check_injury_info | 1-2 | ⭐⭐⭐⭐⭐ | 1.1 |
| 2.1 | Tool: suggest_treatment | 1-2 | ⭐⭐⭐⭐ | 1.1 |
| 3.1 | Preguntas Contextuales | 1 | ⭐⭐⭐ | - |
| ~~4.1-4.3~~ | ~~Historial Paciente~~ | ~~2-3~~ | ⚠️ **POSTPONED** | ~~PostgreSQL~~ |
| ~~5.1-5.3~~ | ~~Métricas y ROI~~ | ~~1-2~~ | ⚠️ **POSTPONED** | ~~-~~ |
| 6.1-6.3 | RAG con pgvector | 3-4 | ⭐⭐⭐ | Opcional |

**Total MVP Esencial (Fases 1-3):** 4-6 días
**Total con RAG (Fases 1-3 + 6):** 7-10 días

### ⚠️ **Nota:** Historial y Métricas se posponen porque:
- Al principio no habrá muchos usuarios recurrentes
- No necesitas bases de datos complejas todavía
- Enfócate en funcionalidades que impacten desde el primer uso

---

## 🤔 ¿Más cosas con LangChain? ¿Over-engineering?

### **✅ Lo que YA tienes es suficiente:**
- ✅ ReAct agent (patrón correcto)
- ✅ Memory multi-turno (funciona bien)
- ✅ Tools bien estructuradas (fácil de extender)
- ✅ System prompt personalizado (flexible)

### **⚠️ Lo que SÍ agregar (No es over-engineering):**

#### **1. Nuevas Tools (Recomendado)**
```typescript
// Estas tools son necesarias y no son over-engineering
- check_injury_info      // ✅ Necesaria para RAC
- suggest_treatment      // ✅ Necesaria para sugerencias
- get_patient_history    // ✅ Necesaria para personalización
```

**Por qué NO es over-engineering:**
- Son extensiones naturales de lo que ya tienes
- Cada tool tiene un propósito claro
- Fácil de mantener y testear

---

#### **2. Retrievers de LangChain (Opcional)**
```typescript
// Para RAG avanzado
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai/embeddings';

// Solo si implementas Fase 6 (RAG)
```

**¿Es over-engineering?**
- ❌ **SÍ, si solo usas knowledge base simple** (Fase 1)
- ✅ **NO, si quieres RAG avanzado** (Fase 6)

**Recomendación:** 
- **MVP:** No uses retrievers, solo knowledge base simple
- **Premium:** Usa retrievers solo si implementas RAG completo

---

#### **3. Chains Adicionales (Over-engineering)**
```typescript
// NO hacer esto (over-engineering)
const bookingChain = SequentialChain([
  intentChain,
  entityChain,
  availabilityChain,
  confirmationChain,
]);
```

**¿Por qué es over-engineering?**
- Ya tienes ReAct agent que hace todo esto
- Chains adicionales añaden complejidad sin beneficio
- El ReAct agent ya decide qué hacer automáticamente

**Recomendación:** ❌ NO agregar chains adicionales

---

#### **4. Agentes Múltiples (Over-engineering)**
```typescript
// NO hacer esto (over-engineering)
const supervisorAgent = new SupervisorAgent();
const bookingAgent = new BookingAgent();
const supportAgent = new SupportAgent();
```

**¿Por qué es over-engineering?**
- Un solo agente puede manejar todo
- Múltiples agentes añaden complejidad innecesaria
- Más difícil de mantener y debuggear

**Recomendación:** ❌ NO usar múltiples agentes

---

#### **5. Memory Avanzada (Over-engineering para MVP)**
```typescript
// NO hacer esto para MVP (over-engineering)
const memory = new ConversationSummaryMemory({
  llm: chatModel,
  memoryKey: "chat_history",
  returnMessages: true,
});
```

**¿Por qué es over-engineering?**
- Ya tienes `InMemoryChatMessageHistory` que funciona
- Summary memory añade coste (más llamadas API)
- No es necesario para conversaciones cortas

**Recomendación:** 
- **MVP:** Mantén `InMemoryChatMessageHistory`
- **Futuro:** Considera summary memory solo si conversaciones > 20 mensajes

---

## ✅ Recomendación Final

### **Lo que SÍ hacer:**
1. ✅ Agregar nuevas tools (check_injury_info, suggest_treatment, get_patient_history)
2. ✅ Mejorar system prompt con contexto médico
3. ✅ Mantener ReAct agent (ya funciona bien)
4. ✅ Mantener memory simple (InMemoryChatMessageHistory)

### **Lo que NO hacer (Over-engineering):**
1. ❌ Chains adicionales (ReAct ya lo hace)
2. ❌ Múltiples agentes (uno es suficiente)
3. ❌ Memory avanzada (no necesario para MVP)
4. ❌ RAG completo si knowledge base simple funciona

### **Balance Perfecto:**
```
Lo que tienes (LangChain base) ✅
+ Nuevas tools (3-4 tools) ✅
+ Knowledge base simple ✅
+ Historial en PostgreSQL ✅
= MVP potente sin over-engineering ✅
```

---

## 🎯 Plan de Acción Inmediato (Simplificado)

### **Semana 1 (MVP Esencial):**
- **Día 1:** Fase 1.1 (Knowledge Base estructurada)
- **Día 2:** Fase 1.2 (Tool: check_injury_info)
- **Día 3:** Fase 2.1 (Tool: suggest_treatment)
- **Día 4:** Fase 3.1 (Preguntas contextuales en prompt)
- **Día 5:** Testing y refinamiento

### **Semana 2 (Opcional - RAG Avanzado):**
- **Día 1-3:** Fase 6 (RAG con pgvector) - Solo si quieres algo más avanzado
- **Día 4-5:** Testing y demo prep

### **Resultado MVP Esencial:**
- ✅ **4-5 días de trabajo**
- ✅ **Sin bases de datos complejas**
- ✅ **Sin over-engineering**
- ✅ **Funcionalidades impactantes para demo**
- ✅ **Listo para demo B2B**

### **Lo que tendrás:**
1. ✅ Knowledge base inteligente
2. ✅ Sugerencias automáticas de tratamiento
3. ✅ Preguntas contextuales
4. ✅ Todo funcionando sin necesidad de usuarios recurrentes
5. ✅ Perfecto para mostrar en demo a nuevos clientes

---

**¿Listo para empezar?** 🚀


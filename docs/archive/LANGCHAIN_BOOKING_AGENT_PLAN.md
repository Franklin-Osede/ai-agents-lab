# 🚀 Plan Completo: LangChain para Booking Agent (Master First)

## 🎯 Estrategia: Master el Booking Agent Primero

**Enfoque**: Implementar LangChain completamente en el **Booking Agent** primero, hacerlo robusto y profesional. Una vez dominado, replicar el patrón en los otros agentes.

**Por qué Booking Agent primero:**
- ✅ Es el más complejo (necesita tools + memory + structured extraction)
- ✅ Es el más visible para demos/outreach
- ✅ Una vez funcionando bien, será el template para los demás
- ✅ Los otros agentes son más simples (solo memory, sin tools)

---

## 📊 Análisis del Estado Actual del Booking Agent

### ✅ Lo que ya funciona:
- **IAiProvider interface** con `generateResponse` y `classifyIntent`
- **OpenAiProvider** básico funcionando
- **EntityExtractorService** con parsing JSON libre
- **BookingAgentService** con flujo básico de procesamiento
- **BookingEntities** value object validado
- **IBookingRepository** interface definida
- **IntentClassifierService** con regex básico

### ❌ Gaps críticos:
1. **Sin memoria multi-turno** → No puede mantener contexto entre mensajes
2. **Sin tool calling** → No puede consultar disponibilidad real ni confirmar bookings
3. **Extracción frágil** → Parsing JSON libre sin validación robusta
4. **Sin persistencia real** → Repository es placeholder
5. **Sin normalización** → Fechas/horas sin timezone ni validación

---

## 🎯 Objetivo con LangChain

**Hacer el Booking Agent robusto y profesional para demos, sin sobreingeniería:**

1. ✅ **Memory ligera** para conversaciones multi-turno
2. ✅ **Tool calling** para acciones reales (check availability, confirm booking)
3. ✅ **Structured extraction** con validación y normalización
4. ✅ **Chain profesional** que integre todo
5. ✅ **Mantener DDD** - no romper arquitectura actual
6. ✅ **Diseñar para reutilización** - otros agentes usarán el mismo patrón después

---

## 🏗️ Arquitectura Propuesta

```
backend/src/
├── core/
│   ├── domain/agents/interfaces/
│   │   └── ai-provider.interface.ts (extender con memory/tools opcionales)
│   └── infrastructure/ai/
│       ├── openai.provider.ts (mantener como fallback)
│       └── langchain.provider.ts (NUEVO - reutilizable)
│
└── agents/booking-agent/
    ├── application/
    │   ├── services/
    │   │   ├── booking-agent.service.ts (integrar LangChain)
    │   │   └── entity-extractor.service.ts (usar StructuredOutputParser)
    │   ├── tools/ (NUEVO - específico de booking)
    │   │   ├── check-availability.tool.ts
    │   │   ├── suggest-times.tool.ts
    │   │   └── confirm-booking.tool.ts
    │   └── memory/ (NUEVO - reutilizable después)
    │       ├── conversation-memory.interface.ts
    │       └── in-memory-store.ts (adapter simple)
    │
    └── infrastructure/
        └── repositories/
            └── in-memory-booking.repository.ts (NUEVO - para demos)
```

**Nota**: La estructura de `memory/` y `langchain.provider.ts` será reutilizable para otros agentes después.

---

## 📋 Fases de Implementación (Booking Agent Only)

### **FASE 1: Infraestructura Base** ⭐ CRÍTICA

#### 1.1 Instalar Dependencias
```bash
cd backend
npm install langchain @langchain/openai @langchain/core zod
```

#### 1.2 Crear LangChainProvider (Reutilizable)
- Implementa `IAiProvider` (compatibilidad)
- Usa `ChatOpenAI` de LangChain
- Soporta memory y tools (opcionales)
- Configurable via env: `AI_PROVIDER=langchain|openai`
- **Diseñado para ser usado por otros agentes después**

#### 1.3 Extender IAiProvider Interface (Opcional)
- Agregar métodos opcionales para memory: `saveConversation`, `getConversation`
- Mantener backward compatibility (todos los métodos opcionales)

**Archivos:**
- `backend/src/core/infrastructure/ai/langchain.provider.ts` ⭐ REUTILIZABLE
- `backend/src/core/domain/agents/interfaces/ai-provider.interface.ts` (extender opcionalmente)

---

### **FASE 2: Extracción Estructurada** ⭐ CRÍTICA

#### 2.1 StructuredOutputParser para BookingEntities
- Usar `zod` schema para validación
- Normalización automática:
  - Fechas: "mañana" → ISO date
  - Horas: "2pm" → "14:00"
  - Timezone handling
- Fallback graceful si parsing falla

**Archivos:**
- `backend/src/agents/booking-agent/application/services/entity-extractor.service.ts` (refactorizar)
- `backend/src/agents/booking-agent/domain/value-objects/booking-entities.ts` (agregar schema zod)

---

### **FASE 3: Memory Ligera** ⭐ CRÍTICA

#### 3.1 Conversation Memory Interface (Reutilizable)
```typescript
interface IConversationMemory {
  save(businessId: string, customerId: string, messages: Message[]): Promise<void>;
  get(businessId: string, customerId: string): Promise<Message[]>;
  clear(businessId: string, customerId: string): Promise<void>;
}
```

#### 3.2 In-Memory Adapter (para demos)
- BufferMemory simple por `businessId+customerId`
- TTL de 1 hora
- Luego se puede cambiar a Redis sin romper código
- **Estructura reutilizable para otros agentes**

#### 3.3 Integrar en LangChainProvider
- Usar `BufferMemory` de LangChain
- Keyed por `businessId+customerId`
- Opcional (no todos los agentes necesitan memory)

**Archivos:**
- `backend/src/agents/booking-agent/application/memory/conversation-memory.interface.ts` ⭐ REUTILIZABLE
- `backend/src/agents/booking-agent/application/memory/in-memory-store.ts` ⭐ REUTILIZABLE
- `backend/src/core/infrastructure/ai/langchain.provider.ts` (integrar memory opcional)

---

### **FASE 4: Tools Mínimas (Booking-Specific)** ⭐ CRÍTICA

#### 4.1 CheckAvailabilityTool
```typescript
- Input: { businessId, date, duration? }
- Output: { slots: string[] }
- Usa: IBookingRepository.findAvailableSlots
```

#### 4.2 SuggestTimesTool
```typescript
- Input: { businessId, preferredDate?, preferredTime?, serviceType? }
- Output: { suggestions: { time: string, reason: string }[] }
- Lógica: Reglas simples + preferencias del cliente
```

#### 4.3 ConfirmBookingTool
```typescript
- Input: { businessId, customerId, date, time, serviceType? }
- Output: { bookingId: string, status: string }
- Usa: IBookingRepository.save
```

**Archivos:**
- `backend/src/agents/booking-agent/application/tools/check-availability.tool.ts` (booking-specific)
- `backend/src/agents/booking-agent/application/tools/suggest-times.tool.ts` (booking-specific)
- `backend/src/agents/booking-agent/application/tools/confirm-booking.tool.ts` (booking-specific)

**Nota**: Otros agentes crearán sus propias tools si las necesitan.

---

### **FASE 5: LangChain Chain para Booking** ⭐ CRÍTICA

#### 5.1 Crear BookingAgentChain
- Usa `createReactAgent` con tools
- System prompt profesional con contexto del negocio
- Integra memory automáticamente
- Manejo de errores graceful
- **Patrón reutilizable para otros agentes**

#### 5.2 Integrar en BookingAgentService
- Nuevo método: `processBookingRequestWithLangChain`
- Feature flag: `USE_LANGCHAIN=true|false`
- Mantener método original como fallback
- Migración gradual

**Archivos:**
- `backend/src/agents/booking-agent/application/services/booking-agent-chain.service.ts` (booking-specific)
- `backend/src/agents/booking-agent/application/services/booking-agent.service.ts` (integrar)

---

### **FASE 6: Repository Mock para Demos** ⭐ IMPORTANTE

#### 6.1 InMemoryBookingRepository
- Implementa `IBookingRepository`
- Slots preseeded para demos realistas
- Conflict detection básico
- Horarios de negocio configurables

**Archivos:**
- `backend/src/agents/booking-agent/infrastructure/repositories/in-memory-booking.repository.ts`
- `backend/src/agents/booking-agent/booking-agent.module.ts` (usar mock en demos)

---

### **FASE 7: Configuración y Tests** ⭐ IMPORTANTE

#### 7.1 CoreModule - Selección de Provider
- Env var: `AI_PROVIDER=langchain|openai`
- Factory pattern para elegir provider
- Tests de ambos providers

#### 7.2 Tests Exhaustivos
- Unit: Tools individuales
- Integration: Chain completo con mocks
- E2E: Flujo completo con in-memory repo
- Edge cases: Memory failures, tool failures, parsing errors

**Archivos:**
- `backend/src/core/core.module.ts` (factory)
- Tests en cada tool y service

---

## 🔧 Detalles Técnicos

### Memory Strategy
- **BufferMemory** por conversación (businessId+customerId)
- Máximo 10 mensajes por conversación
- TTL: 1 hora (configurable)
- Limpieza automática de conversaciones viejas
- **Reutilizable**: Otros agentes usarán la misma interfaz

### Tool Calling Strategy
- **ReAct Agent** (Reasoning + Acting)
- Máximo 3 tool calls por mensaje (evitar loops)
- Timeout de 30s por tool call
- Fallback si tool falla
- **Booking-specific**: Solo este agente tiene tools por ahora

### Structured Output Strategy
- **Zod schemas** para validación
- **StructuredOutputParser** de LangChain
- Normalización automática:
  - Fechas relativas → ISO dates
  - Horas coloquiales → HH:mm
  - Servicios → taxonomía normalizada
- **Reutilizable**: Otros agentes crearán sus propios schemas

### Error Handling
- Tool failures → mensaje de cortesía al usuario
- Memory failures → continuar sin memoria (stateless)
- Parsing failures → usar valores por defecto
- Nunca romper el flujo completo

---

## 📊 Comparación: Antes vs Después

### Antes (Actual)
```
Usuario → IntentClassifier → EntityExtractor → AI Response → Done
```
- ❌ Sin memoria
- ❌ Sin tool calling
- ❌ Parsing frágil
- ❌ Sin acciones reales

### Después (Con LangChain)
```
Usuario → Memory (contexto) → LangChain Chain → Tools → Structured Response → Save Memory → Done
```
- ✅ Memoria multi-turno
- ✅ Tool calling real
- ✅ Parsing robusto
- ✅ Acciones reales (check, confirm)

---

## 🎯 Criterios de Éxito (Booking Agent)

### Funcionalidad
- [ ] Conversación multi-turno funciona (ej: "quiero botox" → "¿qué día?" → "mañana" → "¿qué hora?" → "2pm")
- [ ] Tools se llaman correctamente (check availability, confirm booking)
- [ ] Memory persiste entre mensajes
- [ ] Extracción estructurada funciona con edge cases

### Robustez
- [ ] Manejo graceful de errores
- [ ] Fallbacks cuando tools fallan
- [ ] Validación de entidades
- [ ] Timeouts y rate limiting

### Demo/Outreach
- [ ] Slots preseeded para demos realistas
- [ ] Swagger examples con flujo multi-turno
- [ ] Logs claros para debugging
- [ ] Performance aceptable (<2s por request)

### Reutilización Futura
- [ ] LangChainProvider puede usarse por otros agentes
- [ ] Memory interface es genérica
- [ ] Patrón de chain es claro y documentado
- [ ] Otros agentes pueden seguir el mismo patrón fácilmente

---

## 🚀 Orden de Implementación

1. **Día 1**: Fase 1 (Infraestructura) + Fase 2 (Structured Output)
2. **Día 2**: Fase 3 (Memory) + Fase 4 (Tools)
3. **Día 3**: Fase 5 (Chain) + Fase 6 (Repository Mock)
4. **Día 4**: Fase 7 (Config + Tests) + Integración completa
5. **Día 5**: Polish, demos, documentación

---

## 💡 Decisiones de Diseño

### ✅ Hacer:
- Mantener DDD boundaries claros
- Tools en application layer (booking-specific)
- Memory abstracta (interface reutilizable)
- Feature flag para migración gradual
- Tests exhaustivos
- **Diseñar pensando en reutilización** (pero no sobreingeniería)

### ❌ No hacer:
- No crear decenas de tools (solo las esenciales para booking)
- No usar Redis aún (in-memory primero)
- No romper código existente
- No sobreoptimizar prematuramente
- No agregar complejidad innecesaria
- **No implementar otros agentes aún** (master booking primero)

---

## 🔄 Plan Post-Booking Agent

Una vez que el Booking Agent esté dominado y funcionando perfectamente:

1. **DM Response Agent**: Usar LangChainProvider + Memory (sin tools)
2. **Follow-up Agent**: Usar LangChainProvider + Memory (sin tools)
3. **Voice Agent**: Evaluar si necesita LangChain (probablemente solo para mejor generación de scripts)

**Patrón a replicar:**
- Mismo LangChainProvider
- Misma Memory interface
- Cada agente crea sus propias tools si las necesita
- Mismo patrón de chain

---

## 📝 Próximos Pasos

1. ✅ Crear este plan
2. ⏭️ Instalar dependencias
3. ⏭️ Implementar Fase 1-2
4. ⏭️ Implementar Fase 3-4
5. ⏭️ Implementar Fase 5-6
6. ⏭️ Tests y polish
7. ⏭️ **Master el Booking Agent completamente**
8. ⏭️ Luego replicar en otros agentes

---

**¿Empezamos con la implementación del Booking Agent?**

# 🤖 LangChain Implementation Strategy - Booking Agent

## 🎯 Decisión: Usar LangChain

**Razón Principal:** Necesitamos **Tool Calling** para que el agente pueda realizar acciones reales (consultar calendario, confirmar citas, etc.)

---

## 📦 Instalación

```bash
cd backend
npm install langchain @langchain/openai @langchain/core
```

**Versiones recomendadas:**
- `langchain`: ^0.1.0
- `@langchain/openai`: ^0.0.14
- `@langchain/core`: ^0.1.0

---

## 🏗️ Arquitectura con LangChain

### Estructura Nueva:

```
backend/src/agents/booking-agent/
├── application/
│   ├── tools/ (NUEVO - LangChain Tools)
│   │   ├── check-availability.tool.ts
│   │   ├── suggest-times.tool.ts
│   │   ├── confirm-booking.tool.ts
│   │   ├── cancel-booking.tool.ts
│   │   └── get-customer-history.tool.ts
│   ├── agents/ (NUEVO - LangChain Agents)
│   │   └── booking-agent-langchain.ts
│   └── services/
│       ├── booking-agent.service.ts (mejorar)
│       └── calendar-service.ts (NUEVO)
├── infrastructure/
│   └── ai/
│       └── langchain-provider.ts (NUEVO)
```

---

## 🔧 Implementación Paso a Paso

### Paso 1: Crear LangChain Provider

**Archivo:** `backend/src/core/infrastructure/ai/langchain.provider.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LangChainProvider {
  private readonly llm: ChatOpenAI;

  constructor(private configService: ConfigService) {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  getLLM(): ChatOpenAI {
    return this.llm;
  }
}
```

---

### Paso 2: Crear Tools (Funciones que el Agente puede Usar)

#### Tool 1: Check Availability

**Archivo:** `backend/src/agents/booking-agent/application/tools/check-availability.tool.ts`

```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CheckAvailabilityTool extends DynamicStructuredTool {
  constructor(private calendarService: CalendarService) {
    super({
      name: 'check_availability',
      description: 'Check available time slots for a specific date. Use this when customer asks about availability.',
      schema: z.object({
        date: z.string().describe('Date in YYYY-MM-DD format'),
        duration: z.number().optional().describe('Duration in minutes'),
      }),
      func: async ({ date, duration }) => {
        const slots = await this.calendarService.getAvailableSlots(date, duration);
        return JSON.stringify(slots);
      },
    });
  }
}
```

#### Tool 2: Suggest Times

**Archivo:** `backend/src/agents/booking-agent/application/tools/suggest-times.tool.ts`

```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

@Injectable()
export class SuggestTimesTool extends DynamicStructuredTool {
  constructor(private calendarService: CalendarService) {
    super({
      name: 'suggest_times',
      description: 'Suggest best available times for booking based on customer preferences and business rules.',
      schema: z.object({
        preferredDate: z.string().optional(),
        preferredTime: z.string().optional(),
        serviceType: z.string().optional(),
      }),
      func: async ({ preferredDate, preferredTime, serviceType }) => {
        const suggestions = await this.calendarService.suggestTimes({
          preferredDate,
          preferredTime,
          serviceType,
        });
        return JSON.stringify(suggestions);
      },
    });
  }
}
```

#### Tool 3: Confirm Booking

**Archivo:** `backend/src/agents/booking-agent/application/tools/confirm-booking.tool.ts`

```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

@Injectable()
export class ConfirmBookingTool extends DynamicStructuredTool {
  constructor(private bookingService: BookingAgentService) {
    super({
      name: 'confirm_booking',
      description: 'Confirm a booking with selected date and time. Use this when customer agrees to book.',
      schema: z.object({
        date: z.string(),
        time: z.string(),
        customerId: z.string(),
        serviceType: z.string().optional(),
      }),
      func: async ({ date, time, customerId, serviceType }) => {
        const booking = await this.bookingService.confirmBooking({
          date,
          time,
          customerId,
          serviceType,
        });
        return JSON.stringify({ success: true, bookingId: booking.id });
      },
    });
  }
}
```

---

### Paso 3: Crear Agente Reactivo con Tools

**Archivo:** `backend/src/agents/booking-agent/application/agents/booking-agent-langchain.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { LangChainProvider } from '../../../../core/infrastructure/ai/langchain.provider';
import { CheckAvailabilityTool } from '../tools/check-availability.tool';
import { SuggestTimesTool } from '../tools/suggest-times.tool';
import { ConfirmBookingTool } from '../tools/confirm-booking.tool';

@Injectable()
export class BookingAgentLangChain {
  private agentExecutor: AgentExecutor;

  constructor(
    private langChainProvider: LangChainProvider,
    private checkAvailabilityTool: CheckAvailabilityTool,
    private suggestTimesTool: SuggestTimesTool,
    private confirmBookingTool: ConfirmBookingTool,
  ) {
    this.initializeAgent();
  }

  private async initializeAgent() {
    const llm = this.langChainProvider.getLLM();
    const tools = [
      this.checkAvailabilityTool,
      this.suggestTimesTool,
      this.confirmBookingTool,
    ];

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are a professional booking assistant.
Your role is to help customers book appointments efficiently and friendly.
You have access to tools to check availability, suggest times, and confirm bookings.
Always be helpful, clear, and confirm details before booking.`],
      ['placeholder', '{chat_history}'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);

    const agent = await createReactAgent({
      llm,
      tools,
      prompt,
    });

    this.agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });
  }

  async processMessage(
    message: string,
    context: {
      customerId?: string;
      businessId: string;
      chatHistory?: string[];
    },
  ): Promise<string> {
    const result = await this.agentExecutor.invoke({
      input: message,
      chat_history: context.chatHistory || [],
    });

    return result.output;
  }
}
```

---

### Paso 4: Integrar en BookingAgentService

**Modificar:** `backend/src/agents/booking-agent/application/services/booking-agent.service.ts`

```typescript
// Agregar método nuevo que usa LangChain
async processBookingRequestWithLangChain(
  request: BookingRequest,
): Promise<Result<BookingResponse>> {
  try {
    const response = await this.bookingAgentLangChain.processMessage(
      request.message,
      {
        customerId: request.customerId,
        businessId: request.businessId,
        chatHistory: request.context?.chatHistory,
      },
    );

    // Parse response and extract entities, intent, etc.
    return Result.ok({
      success: true,
      message: response,
      // ... extract other data
    });
  } catch (error) {
    return Result.fail(error as Error);
  }
}
```

---

## 🧪 Testing Strategy con LangChain

### Mock LangChain para Tests:

```typescript
// En tests
const mockLangChainProvider = {
  getLLM: jest.fn().mockReturnValue({
    invoke: jest.fn().mockResolvedValue({
      output: 'Mocked response',
    }),
  }),
};

const mockAgentExecutor = {
  invoke: jest.fn().mockResolvedValue({
    output: 'Test response',
  }),
};
```

---

## 📊 Ventajas de Esta Arquitectura

1. **Tool Calling**: El agente puede realizar acciones reales
2. **Memory**: Recuerda contexto de conversación
3. **Reactivo**: Decide qué tool usar según necesidad
4. **Escalable**: Fácil agregar nuevos tools
5. **Testeable**: Cada tool se testea independientemente

---

## 🔄 Migración Gradual

### Estrategia:

1. **Fase 1**: Implementar LangChain paralelo (no romper existente)
2. **Fase 2**: Feature flag para elegir provider
3. **Fase 3**: Migrar gradualmente
4. **Fase 4**: Deprecar provider antiguo

---

## 📋 Checklist de Implementación

### Setup (Día 1)
- [ ] Instalar dependencias LangChain
- [ ] Crear LangChainProvider
- [ ] Tests básicos

### Tools (Día 2-3)
- [ ] CheckAvailabilityTool
- [ ] SuggestTimesTool
- [ ] ConfirmBookingTool
- [ ] Tests de cada tool

### Agent (Día 4)
- [ ] Crear BookingAgentLangChain
- [ ] Integrar tools
- [ ] Tests de agente

### Integración (Día 5)
- [ ] Integrar en BookingAgentService
- [ ] Feature flag
- [ ] Tests end-to-end

---

## 💰 Costos con LangChain

**Consideración:** LangChain puede hacer múltiples llamadas a API:
- Tool calling: 1 llamada inicial + N llamadas por tool usado
- Ejemplo: 1 mensaje puede resultar en 3-5 llamadas API
- **Costo estimado**: 2-3x más que implementación actual

**Mitigación:**
- Usar `gpt-3.5-turbo` para tool calling (más barato)
- Cachear resultados de tools
- Limitar número de tool calls por conversación

---

## ✅ Decisión Final

**Recomendación: Implementar LangChain**

**Plan:**
1. Implementar en paralelo (no romper existente)
2. Feature flag para elegir
3. Migrar gradualmente
4. Optimizar costos después

**¿Procedemos con LangChain o prefieres mejorar el sistema actual?**


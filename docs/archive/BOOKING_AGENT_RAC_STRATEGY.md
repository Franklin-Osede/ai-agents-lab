# 🧠 Estrategia RAC (Retrieval Augmented Context) - Booking Agent Fisioterapeuta
## 🎯 Para Product Demo B2B - Sin Coste Adicional

## 🎯 Objetivo
Implementar estrategias RAC **avanzadas** que impresionen a negocios potenciales en la demo, demostrando:
- **Ahorro de tiempo**: Automatización inteligente que reduce trabajo manual
- **Aumento de ingresos**: Mejor conversión y upsell automático
- **Tecnología avanzada**: RAC, IA contextual, personalización

**Todo sin coste adicional**: Usando PostgreSQL de Render (gratis) y la infraestructura existente.

---

## 📊 Estado Actual

### ✅ Lo que ya tienes (Infraestructura):
- **Body Selector Component**: Mapa interactivo del cuerpo humano (SVG)
- **LangChain Agent**: ReAct agent con tools y memory
- **Booking Flow**: Check availability, suggest times, confirm booking
- **Memory Multi-turno**: Contexto de conversación persistente
- **TypeORM + PostgreSQL**: Configurado (soporta Render gratis)
- **InMemory Repositories**: Para demos (fácil migrar a DB real)

### 🎯 Para Demo B2B - Necesitas Mostrar:
- **RAC Avanzado**: Knowledge base inteligente que demuestra expertise
- **Personalización Real**: Historial de pacientes, preferencias, contexto
- **ROI Medible**: Métricas que muestren ahorro de tiempo/dinero
- **Tecnología Premium**: Features que justifiquen precio premium

### 💰 Estrategia de Coste Cero:
- ✅ **PostgreSQL de Render**: Gratis (hasta 90 días, luego $7/mes)
- ✅ **Knowledge Base**: JSON/TypeScript (sin coste)
- ✅ **Embeddings**: Usar OpenAI embeddings (ya tienes API key)
- ✅ **Vector Search**: PostgreSQL con pgvector (gratis en Render)
- ✅ **Sin DynamoDB**: Evitar costes AWS innecesarios

---

## 🚀 Estrategias RAC para Demo B2B (Priorizadas por Impacto Visual)

### **NIVEL 1: RAC Básico con Knowledge Base (Demo Impactante)** ⭐⭐⭐⭐⭐
**Para mostrar en demo**: "Mira cómo el agente entiende el contexto médico"

#### 1.1 **Knowledge Base de Lesiones Comunes** 
**Impacto**: ⭐⭐⭐⭐⭐ | **Complejidad**: ⭐⭐ | **ROI**: Muy Alto

**¿Qué es?**
Base de conocimiento estructurada con información sobre lesiones comunes por parte del cuerpo, síntomas típicos, y tratamientos recomendados.

**Por qué es "no-brainer":**
- El agente puede dar información médica básica inmediatamente
- Reduce fricción: el cliente no necesita explicar todo desde cero
- Demuestra expertise y profesionalismo
- Aumenta confianza antes de la cita

**Implementación:**
```typescript
// Estructura de datos simple (JSON/TypeScript)
interface InjuryKnowledge {
  bodyPart: BodyPart;
  commonInjuries: {
    name: string;
    symptoms: string[];
    typicalDuration: string;
    recommendedSessions: number;
    exercises?: string[];
  }[];
}

// Ejemplo:
const physioKnowledge: InjuryKnowledge[] = [
  {
    bodyPart: 'lumbar',
    commonInjuries: [
      {
        name: 'Lumbalgia',
        symptoms: ['Dolor en zona baja de espalda', 'Rigidez matutina', 'Dificultad para doblarse'],
        typicalDuration: '2-6 semanas',
        recommendedSessions: 6-8,
        exercises: ['Estiramientos lumbares', 'Fortalecimiento core']
      },
      // ... más lesiones
    ]
  }
];
```

**Cómo se integra:**
1. Cuando el usuario selecciona una parte del cuerpo → El agente busca en la knowledge base
2. El agente puede preguntar: "¿Sientes alguno de estos síntomas: [lista]?"
3. Basado en la respuesta, sugiere el tipo de lesión más probable
4. Ofrece información educativa: "La lumbalgia típicamente requiere 6-8 sesiones..."

**Archivos a crear:**
- `backend/src/agents/booking-agent/domain/knowledge/physio-knowledge.ts` (JSON estructurado)
- `backend/src/agents/booking-agent/application/services/physio-knowledge.service.ts`
- `backend/src/agents/booking-agent/infrastructure/repositories/physio-knowledge.repository.ts` (TypeORM entity)

**Tool nuevo:**
```typescript
// check_injury_info tool
// Input: bodyPart
// Output: Información sobre lesiones comunes, síntomas, duración estimada
// Storage: PostgreSQL (Render gratis) con TypeORM
```

**Para Demo B2B - Lo que muestras:**
1. Cliente selecciona "lumbar" en el mapa
2. Agente inmediatamente: "Veo que tienes dolor lumbar. Las causas más comunes son..."
3. Agente pregunta síntomas contextuales
4. Agente sugiere tratamiento específico con precio
5. **Mensaje clave**: "Todo esto automáticamente, sin que tu equipo tenga que explicar lo mismo 50 veces al día"

---

#### 1.2 **Sugerencias Inteligentes de Tratamiento**
**Impacto**: ⭐⭐⭐⭐ | **Complejidad**: ⭐⭐ | **ROI**: Alto

**¿Qué es?**
Basado en la parte del cuerpo seleccionada y síntomas mencionados, el agente sugiere:
- Tipo de tratamiento recomendado (masaje, fisioterapia, estiramientos)
- Número de sesiones estimadas
- Duración de cada sesión
- Precio aproximado

**Por qué es "no-brainer":**
- El cliente ve valor inmediato (información profesional)
- Transparencia en precios reduce fricción
- Sugerencias personalizadas demuestran inteligencia
- Aumenta conversión (el cliente sabe qué esperar)

**Implementación:**
```typescript
interface TreatmentSuggestion {
  bodyPart: BodyPart;
  symptoms: string[];
  suggestedTreatment: {
    type: 'fisioterapia' | 'masaje' | 'estiramientos' | 'combinado';
    sessions: number;
    duration: number; // minutos
    priceRange: { min: number; max: number };
    description: string;
  };
}

// Tool: suggest_treatment
// Input: bodyPart, symptoms (opcional)
// Output: TreatmentSuggestion
```

**Flujo:**
1. Usuario selecciona "lumbar" en el mapa
2. Agente: "Veo que tienes dolor lumbar. ¿Sientes rigidez matutina o dolor al doblarte?"
3. Usuario: "Sí, me duele al doblarme"
4. Agente: "Basado en tus síntomas, te recomiendo un tratamiento de fisioterapia de 6-8 sesiones. Cada sesión dura 45 minutos y cuesta entre 50-70€. ¿Te gustaría agendar la primera cita?"

**Archivos:**
- Extender `suggest-times.tool.ts` o crear `suggest-treatment.tool.ts`

---

#### 1.3 **Preguntas Inteligentes de Seguimiento**
**Impacto**: ⭐⭐⭐⭐ | **Complejidad**: ⭐ | **ROI**: Alto

**¿Qué es?**
El agente hace preguntas contextuales basadas en la parte del cuerpo seleccionada para entender mejor la situación.

**Por qué es "no-brainer":**
- Demuestra que el agente "entiende" el contexto
- Reduce tiempo de conversación (menos ida y vuelta)
- Mejora la calidad de la reserva (más información para el fisioterapeuta)

**Implementación:**
```typescript
const contextualQuestions: Record<BodyPart, string[]> = {
  lumbar: [
    "¿Cuándo comenzó el dolor?",
    "¿Es constante o aparece con ciertos movimientos?",
    "¿Has tenido este problema antes?",
    "¿El dolor se irradia hacia las piernas?"
  ],
  neck: [
    "¿Sientes rigidez al mover el cuello?",
    "¿El dolor empeora con el trabajo en computadora?",
    "¿Tienes dolores de cabeza frecuentes?"
  ],
  // ... más partes del cuerpo
};
```

**Flujo:**
1. Usuario selecciona "lumbar"
2. Agente: "Entiendo, dolor lumbar. Para ayudarte mejor, ¿cuándo comenzó el dolor?"
3. Usuario responde
4. Agente hace la siguiente pregunta contextual
5. Al final: "Perfecto, con esta información puedo recomendarte el mejor tratamiento..."

---

### **NIVEL 2: RAC Avanzado con Base de Datos (Demo Premium)** ⭐⭐⭐⭐
**Para mostrar en demo**: "Mira cómo recordamos a cada cliente y personalizamos"

#### 2.1 **Historial del Paciente con PostgreSQL (Render Gratis)**
**Impacto**: ⭐⭐⭐⭐⭐ | **Complejidad**: ⭐⭐⭐ | **ROI**: Muy Alto | **Coste**: $0

**¿Qué es?**
Si el cliente ya ha tenido citas antes, el agente accede a su historial para:
- Recordar lesiones previas
- Sugerir tratamientos similares que funcionaron
- Preguntar sobre el progreso desde la última vez
- Ofrecer continuidad de tratamiento

**Por qué es "no-brainer":**
- Personalización extrema (el cliente se siente "conocido")
- Reduce fricción para clientes recurrentes
- Demuestra valor a largo plazo
- Aumenta retención

**Implementación con PostgreSQL (Render Gratis):**
```typescript
// Entity TypeORM
@Entity('patient_history')
export class PatientHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  businessId: string;

  @Column('jsonb') // PostgreSQL JSONB para flexibilidad
  previousBookings: {
    date: Date;
    bodyPart: BodyPart;
    treatment: string;
    outcome?: 'improved' | 'resolved' | 'ongoing';
  }[];

  @Column('simple-array')
  preferredTimes: string[];

  @Column({ nullable: true })
  preferredTherapist?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Repository con TypeORM
@Injectable()
export class PatientHistoryRepository {
  constructor(
    @InjectRepository(PatientHistoryEntity)
    private repository: Repository<PatientHistoryEntity>,
  ) {}

  async findByCustomer(customerId: string, businessId: string) {
    return this.repository.findOne({
      where: { customerId, businessId },
    });
  }
}

// Tool: get_patient_history
// Input: customerId, businessId
// Output: PatientHistory (desde PostgreSQL)
```

**Setup Render (Gratis):**
1. Crear PostgreSQL en Render (gratis 90 días)
2. Obtener `DATABASE_URL`
3. Agregar a `.env`: `DATABASE_URL=postgresql://...`
4. TypeORM ya está configurado para usar `DATABASE_URL`
5. **Coste: $0** (vs DynamoDB que cuesta)

**Flujo:**
1. Usuario inicia conversación
2. Agente detecta que es cliente recurrente (por teléfono/email)
3. Agente: "¡Hola [Nombre]! Veo que la última vez viniste por dolor lumbar. ¿Cómo ha ido desde entonces?"
4. Si mejoró: "¡Excelente! ¿Hay alguna otra zona que te gustaría trabajar?"
5. Si no mejoró: "Entiendo, a veces estos problemas requieren más sesiones. ¿Te gustaría continuar con el mismo tratamiento?"

**Archivos:**
- `backend/src/agents/booking-agent/infrastructure/repositories/patient-history.repository.ts`
- Extender `booking-agent-chain.service.ts` para incluir historial en el contexto

---

#### 2.2 **RAG con Vector Search en PostgreSQL (pgvector - Gratis)**
**Impacto**: ⭐⭐⭐⭐⭐ | **Complejidad**: ⭐⭐⭐⭐ | **ROI**: Muy Alto | **Coste**: $0

**¿Qué es?**
Sistema RAG completo usando **pgvector** (extensión gratuita de PostgreSQL) para búsqueda semántica de documentos de tratamiento.

**Por qué es "no-brainer" para demo:**
- **Tecnología avanzada visible**: "Mira cómo busca en nuestra base de conocimiento"
- **Sin coste adicional**: pgvector es gratis en Render
- **Escalable**: Puedes agregar más documentos sin límite
- **Diferenciador fuerte**: La mayoría de competidores no tienen RAG

**Implementación con pgvector (Render):**
```typescript
// 1. Habilitar pgvector en Render PostgreSQL (gratis)
// SQL: CREATE EXTENSION vector;

// 2. Entity con embeddings
@Entity('treatment_documents')
export class TreatmentDocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bodyPart: BodyPart;

  @Column('text')
  content: string; // Texto del documento

  @Column('vector', { length: 1536 }) // OpenAI embedding dimension
  embedding: number[]; // Vector embedding

  @Column()
  source: string; // "protocolo_lumbalgia.pdf"

  @CreateDateColumn()
  createdAt: Date;
}

// 3. Service con búsqueda semántica
@Injectable()
export class RAGService {
  async searchSimilar(content: string, bodyPart: BodyPart) {
    // Generar embedding con OpenAI (ya tienes API key)
    const embedding = await this.generateEmbedding(content);

    // Búsqueda vectorial en PostgreSQL
    const results = await this.repository
      .createQueryBuilder('doc')
      .select()
      .where('doc.bodyPart = :bodyPart', { bodyPart })
      .orderBy('doc.embedding <=> :embedding::vector', 'ASC') // Cosine similarity
      .setParameter('embedding', `[${embedding.join(',')}]`)
      .limit(3)
      .getMany();

    return results;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Usar OpenAI embeddings API (ya tienes)
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small', // Barato y efectivo
      input: text,
    });
    return response.data[0].embedding;
  }
}

// 4. Tool para el agente
const ragSearchTool = {
  name: 'search_treatment_knowledge',
  description: 'Busca información detallada sobre tratamientos en la base de conocimiento',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Consulta del usuario' },
      bodyPart: { type: 'string', description: 'Parte del cuerpo' },
    },
  },
};
```

**Setup Render + pgvector:**
1. Crear PostgreSQL en Render
2. Conectar y ejecutar: `CREATE EXTENSION vector;`
3. Usar `DATABASE_URL` en `.env`
4. **Coste: $0** (pgvector es extensión gratuita)

**Para Demo B2B:**
1. Muestra: "El agente busca en nuestra base de conocimiento de 500+ protocolos"
2. Agente encuentra información relevante automáticamente
3. Agente responde con datos precisos y actualizados
4. **Mensaje**: "Tu equipo no necesita memorizar todo, el agente lo hace por ti"

---

#### 2.3 **Sugerencias de Ejercicios Preventivos**
**Impacto**: ⭐⭐⭐ | **Complejidad**: ⭐⭐ | **ROI**: Medio-Alto

**¿Qué es?**
Después de agendar la cita, el agente puede enviar ejercicios preventivos o de preparación que el cliente puede hacer antes de la sesión.

**Por qué es "no-brainer":**
- Valor agregado inmediato (el cliente recibe algo útil antes de pagar)
- Reduce ansiedad (el cliente se siente proactivo)
- Mejora resultados (si hace los ejercicios, la sesión será más efectiva)
- Diferencia del competidor

**Implementación:**
```typescript
interface PreventiveExercise {
  bodyPart: BodyPart;
  exercises: {
    name: string;
    description: string;
    duration: string; // "5 minutos"
    frequency: string; // "2 veces al día"
    videoUrl?: string; // Link a video tutorial
  }[];
}

// Tool: get_preventive_exercises
// Input: bodyPart
// Output: PreventiveExercise[]
```

**Flujo:**
1. Usuario confirma cita
2. Agente: "¡Perfecto! Tu cita está confirmada. Mientras tanto, te recomiendo estos ejercicios suaves que puedes hacer en casa para prepararte: [lista]"
3. Envía mensaje con ejercicios (o link a video)

**Archivos:**
- Extender `confirm-booking.tool.ts` para incluir ejercicios en la respuesta

---

### **NIVEL 3: Métricas y ROI para Demo B2B** ⭐⭐⭐⭐⭐
**Para mostrar en demo**: "Mira cuánto tiempo y dinero ahorra esto"

#### 3.1 **Dashboard de Métricas en Tiempo Real** 
**Impacto**: ⭐⭐⭐⭐⭐ | **Complejidad**: ⭐⭐⭐ | **ROI**: Muy Alto | **Coste**: $0

**¿Qué es?**
Dashboard que muestra métricas en tiempo real durante la demo:
- Tiempo ahorrado por conversación
- Conversión de leads a bookings
- Upsell automático (sesiones múltiples)
- Satisfacción del cliente

**Por qué es crítico para demo B2B:**
- **ROI visible**: "Mira, ahorró 15 minutos en esta conversación"
- **Justifica precio**: "Si ahorras 2 horas/día, eso son 40 horas/mes = $X ahorrados"
- **Diferencia**: La mayoría de competidores no muestran métricas

**Implementación:**
```typescript
// Entity para métricas
@Entity('conversation_metrics')
export class ConversationMetricsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessId: string;

  @Column()
  conversationId: string;

  @Column('int')
  durationSeconds: number; // Tiempo de conversación

  @Column('int')
  messagesCount: number;

  @Column('boolean')
  converted: boolean; // ¿Terminó en booking?

  @Column('int', { nullable: true })
  sessionsBooked: number; // Upsell: múltiples sesiones

  @Column('decimal', { nullable: true })
  revenue: number; // Ingresos generados

  @CreateDateColumn()
  createdAt: Date;
}

// Service para calcular ROI
@Injectable()
export class MetricsService {
  async calculateROI(businessId: string, period: 'day' | 'week' | 'month') {
    const metrics = await this.getMetrics(businessId, period);
    
    return {
      totalConversations: metrics.length,
      totalTimeSaved: metrics.reduce((sum, m) => sum + m.durationSeconds, 0) / 60, // minutos
      conversionRate: (metrics.filter(m => m.converted).length / metrics.length) * 100,
      totalRevenue: metrics.reduce((sum, m) => sum + (m.revenue || 0), 0),
      averageSessionsPerBooking: metrics.filter(m => m.converted).reduce((sum, m) => sum + (m.sessionsBooked || 1), 0) / metrics.filter(m => m.converted).length,
      // ROI calculado
      timeSavedValue: (totalTimeSaved * hourlyRate), // Valor del tiempo ahorrado
      revenueIncrease: (totalRevenue * 0.3), // Estimación de aumento por automatización
    };
  }
}
```

**Para Demo B2B:**
1. Muestra dashboard en tiempo real
2. "En esta demo, el agente ahorró 12 minutos vs proceso manual"
3. "Con 50 conversaciones/día, eso son 10 horas/día = $X/mes ahorrados"
4. "Además, aumentó conversión 25% y upsell 40%"
5. **Mensaje clave**: "ROI positivo desde el primer mes"

---

#### 3.2 **Análisis Predictivo de Tratamientos**
**Impacto**: ⭐⭐⭐⭐ | **Complejidad**: ⭐⭐⭐ | **ROI**: Alto | **Coste**: $0

**¿Qué es?**
Basado en historial de pacientes similares, predice:
- Duración estimada del tratamiento
- Probabilidad de éxito
- Sesiones recomendadas
- Precio optimizado

**Para Demo B2B:**
- "El agente analiza 1000+ casos similares y predice que necesitarás 6-8 sesiones"
- Demuestra inteligencia avanzada
- Justifica precio premium

---

#### 3.2 **Integración con Calendario del Fisioterapeuta**
**Impacto**: ⭐⭐⭐⭐ | **Complejidad**: ⭐⭐⭐⭐ | **ROI**: Alto

**¿Qué es?**
El agente puede ver el calendario real del fisioterapeuta y sugerir horarios basados en:
- Disponibilidad real
- Tipo de tratamiento (algunos requieren más tiempo)
- Preferencias del fisioterapeuta

**Ya tienes:** `check_availability` tool, pero se puede mejorar con más contexto.

**Mejora propuesta:**
- Incluir tipo de tratamiento en la consulta de disponibilidad
- Sugerir fisioterapeutas específicos según especialización
- Considerar tiempo de viaje si es necesario

---

## 📋 Plan de Implementación para Demo B2B (Sin Coste)

### **FASE 1: RAC Básico + Knowledge Base (3-5 días)** ⭐⭐⭐⭐⭐
**Objetivo:** Demo funcional que impresione

1. ✅ **Knowledge Base de Lesiones** (1.1)
   - Crear `physio-knowledge.ts` con datos estructurados
   - Crear `PhysioKnowledgeEntity` (TypeORM)
   - Migrar a PostgreSQL (Render gratis)
   - Agregar tool `check_injury_info`

2. ✅ **Sugerencias de Tratamiento** (1.2)
   - Crear `suggest-treatment.tool.ts`
   - Integrar en el flujo
   - Conectar con knowledge base

3. ✅ **Preguntas Contextuales** (1.3)
   - Agregar preguntas por parte del cuerpo
   - Mejorar prompt del agente

**Setup Render (15 minutos):**
1. Crear cuenta Render (gratis)
2. Crear PostgreSQL database
3. Copiar `DATABASE_URL` a `.env`
4. TypeORM ya está configurado ✅

**Resultado para Demo:**
- Agente da información médica automáticamente
- Sugiere tratamientos personalizados
- **"Mira cómo entiende el contexto sin explicar"**

---

### **FASE 2: RAC Avanzado + Historial (5-7 días)** ⭐⭐⭐⭐
**Objetivo:** Personalización que justifique precio premium

4. ✅ **Historial del Paciente** (2.1)
   - Crear `PatientHistoryEntity` (TypeORM)
   - Crear repository
   - Agregar tool `get_patient_history`
   - **Usar PostgreSQL de Render (gratis)**

5. ✅ **RAG con pgvector** (2.2) - **OPCIONAL pero IMPACTANTE**
   - Habilitar pgvector en Render PostgreSQL
   - Crear `TreatmentDocumentEntity` con embeddings
   - Implementar búsqueda semántica
   - **Coste: $0** (pgvector es gratis)

6. ✅ **Ejercicios Preventivos** (2.3)
   - Base de ejercicios en knowledge base
   - Enviar después de booking

**Resultado para Demo:**
- "Mira cómo recuerda a cada cliente"
- "Busca en nuestra base de conocimiento de 500+ protocolos"
- **"Experiencia premium que justifica precio"**

---

### **FASE 3: Métricas y ROI (2-3 días)** ⭐⭐⭐⭐⭐
**Objetivo:** Mostrar valor medible

7. ✅ **Dashboard de Métricas** (3.1)
   - Crear `ConversationMetricsEntity`
   - Calcular ROI en tiempo real
   - Mostrar en frontend durante demo

8. ✅ **Análisis Predictivo** (3.2)
   - Basado en historial, predecir sesiones
   - Mostrar en respuesta del agente

**Resultado para Demo:**
- "Mira el ROI: ahorró 12 minutos en esta conversación"
- "Con 50 conversaciones/día = $X/mes ahorrados"
- **"ROI positivo desde el primer mes"**

---

## 🏗️ Arquitectura Propuesta (Con PostgreSQL Render)

```
backend/src/agents/booking-agent/
├── domain/
│   ├── knowledge/
│   │   ├── physio-knowledge.ts          # Knowledge base (JSON seed data)
│   │   ├── injury-types.ts              # Tipos de lesiones
│   │   └── treatment-protocols.ts       # Protocolos
│   └── entities/
│       ├── physio-knowledge.entity.ts   # TypeORM entity (PostgreSQL)
│       ├── patient-history.entity.ts    # TypeORM entity (PostgreSQL)
│       ├── treatment-document.entity.ts # TypeORM entity (pgvector)
│       └── conversation-metrics.entity.ts # TypeORM entity (métricas)
├── application/
│   ├── services/
│   │   ├── physio-knowledge.service.ts   # Servicio de conocimiento
│   │   ├── patient-history.service.ts    # Servicio de historial
│   │   ├── rag-service.ts                # RAG con pgvector
│   │   └── metrics.service.ts            # Cálculo de ROI
│   └── tools/
│       ├── check-injury-info.tool.ts     # Tool: info de lesiones
│       ├── suggest-treatment.tool.ts     # Tool: sugerencias
│       ├── get-patient-history.tool.ts   # Tool: historial
│       └── search-treatment-knowledge.tool.ts # Tool: RAG search
└── infrastructure/
    └── repositories/
        ├── physio-knowledge.repository.ts # TypeORM repository
        ├── patient-history.repository.ts  # TypeORM repository
        └── treatment-document.repository.ts # TypeORM repository (pgvector)
```

**Base de Datos (PostgreSQL Render - Gratis):**
```sql
-- Tablas que se crean automáticamente con TypeORM
- physio_knowledge (knowledge base)
- patient_history (historial de pacientes)
- treatment_documents (documentos con embeddings)
- conversation_metrics (métricas de ROI)

-- Extensión pgvector (gratis)
CREATE EXTENSION vector;
```

---

## 💡 Cómo se Adapta a tu Estructura Actual

### **1. Integración con Body Selector**
```typescript
// Cuando el usuario selecciona una parte del cuerpo:
handleBodyPartSelection(partLabel: string) {
  // 1. Emitir evento al backend
  // 2. Backend usa check_injury_info tool
  // 3. Agente responde con información contextual
  // 4. Agente hace preguntas inteligentes
}
```

### **2. Extensión del Booking Agent Chain**
```typescript
// En booking-agent-chain.service.ts
// Agregar nuevas tools al array:
const tools = [
  checkAvailabilityTool,
  this.suggestTimesTool.getTool(),
  confirmBookingTool,
  checkInjuryInfoTool,        // NUEVO
  suggestTreatmentTool,       // NUEVO
  getPatientHistoryTool,      // NUEVO (si es recurrente)
];
```

### **3. Mejora del System Prompt**
```typescript
// Agregar al system prompt:
const systemPrompt = `...
ESPECIALIZACIÓN EN FISIOTERAPIA:
- Cuando el cliente selecciona una parte del cuerpo, usa check_injury_info para obtener información
- Haz preguntas contextuales basadas en la parte del cuerpo
- Sugiere tratamientos usando suggest_treatment
- Si es cliente recurrente, consulta su historial con get_patient_history
- Sé empático y profesional, pero también educativo
...`;
```

---

## 🎯 Métricas para Demo B2B (ROI Visible)

### **KPIs a Mostrar en Demo:**
1. **Tiempo Ahorrado**: Minutos por conversación vs proceso manual
2. **Tasa de Conversión**: % de conversaciones → bookings
3. **Upsell Automático**: % de clientes que agendan múltiples sesiones
4. **ROI Mensual**: $ ahorrados/mes con automatización
5. **Satisfacción**: Score de satisfacción del cliente

### **Cálculo de ROI para Demo:**
```typescript
// Ejemplo de cálculo
const metrics = {
  conversationsPerDay: 50,
  avgTimeSavedPerConversation: 12, // minutos
  hourlyRate: 30, // €/hora del fisioterapeuta
  conversionRate: 0.35, // 35% conversión
  avgRevenuePerBooking: 60, // €
  upsellRate: 0.40, // 40% agendan múltiples sesiones
};

const dailyROI = {
  timeSaved: (metrics.conversationsPerDay * metrics.avgTimeSavedPerConversation) / 60, // horas
  timeValue: ((metrics.conversationsPerDay * metrics.avgTimeSavedPerConversation) / 60) * metrics.hourlyRate,
  bookings: metrics.conversationsPerDay * metrics.conversionRate,
  revenue: (metrics.conversationsPerDay * metrics.conversionRate) * metrics.avgRevenuePerBooking,
  upsellRevenue: (metrics.conversationsPerDay * metrics.conversionRate * metrics.upsellRate) * (metrics.avgRevenuePerBooking * 0.5), // 50% más por upsell
};

const monthlyROI = {
  timeSaved: dailyROI.timeSaved * 22, // días laborables
  timeValue: dailyROI.timeValue * 22,
  totalRevenue: (dailyROI.revenue + dailyROI.upsellRevenue) * 22,
  // ROI = (Ingresos + Tiempo Ahorrado) - Coste del servicio
};
```

### **Objetivos para Demo:**
- **Tiempo ahorrado**: 10-15 min/conversación
- **Conversión**: +25% vs proceso manual
- **Upsell**: +40% de clientes agendan múltiples sesiones
- **ROI mensual**: $500-1000/mes ahorrados (para clínica pequeña)

---

## ⚠️ Consideraciones Importantes

### **1. Disclaimer Médico**
- **CRÍTICO**: Todas las sugerencias deben incluir: "Esta información es orientativa y no sustituye una consulta médica profesional"
- No hacer diagnósticos médicos
- Enfocarse en información educativa y sugerencias de tratamiento

### **2. Privacidad de Datos**
- Historial del paciente debe cumplir con GDPR/LOPD
- Datos médicos sensibles requieren protección especial
- Considerar encriptación de historial

### **3. Escalabilidad**
- Knowledge base puede crecer → Considerar base de datos
- Historial puede ser grande → Implementar paginación
- RAG puede ser costoso → Optimizar queries

---

## 🚀 Próximos Pasos para Demo B2B

### **Setup Inmediato (Hoy):**
1. ✅ **Crear PostgreSQL en Render** (15 min)
   - Ir a render.com
   - Crear PostgreSQL database (gratis)
   - Copiar `DATABASE_URL`
   - Agregar a `.env`: `DATABASE_URL=postgresql://...`

2. ✅ **Habilitar pgvector** (5 min)
   - Conectar a PostgreSQL de Render
   - Ejecutar: `CREATE EXTENSION vector;`

3. ✅ **Verificar TypeORM** (ya está configurado ✅)
   - Tu `app.module.ts` ya soporta `DATABASE_URL`
   - TypeORM creará tablas automáticamente

### **Implementación (Esta Semana):**
1. **Fase 1** (3-5 días): Knowledge Base + Sugerencias
2. **Fase 2** (5-7 días): Historial + RAG (opcional)
3. **Fase 3** (2-3 días): Métricas y ROI

### **Para la Demo:**
1. **Preparar datos seed**: Knowledge base con 50+ lesiones
2. **Preparar historial**: 5-10 pacientes de ejemplo
3. **Preparar métricas**: Dashboard con datos realistas
4. **Script de demo**: Flujo paso a paso para mostrar

---

## 💰 Coste Total: $0

- ✅ PostgreSQL Render: Gratis (90 días) o $7/mes
- ✅ pgvector: Gratis (extensión PostgreSQL)
- ✅ OpenAI Embeddings: Ya tienes API key
- ✅ TypeORM: Ya está configurado
- ✅ Sin DynamoDB: Ahorro de costes AWS

**Comparación:**
- DynamoDB: ~$10-20/mes
- Render PostgreSQL: $0-7/mes
- **Ahorro: $10-13/mes**

---

## 📝 Notas Finales para Demo B2B

**Por qué esto impresiona:**
- ✅ **Tecnología avanzada visible**: RAG, embeddings, búsqueda semántica
- ✅ **ROI medible**: Métricas en tiempo real que muestran ahorro
- ✅ **Personalización real**: Historial, preferencias, contexto
- ✅ **Sin coste adicional**: Todo con infraestructura gratuita
- ✅ **Escalable**: Puede crecer sin límites

**Mensajes clave para demo:**
1. "Mira cómo el agente entiende el contexto médico automáticamente"
2. "Recuerda a cada cliente y personaliza la experiencia"
3. "Busca en nuestra base de conocimiento de 500+ protocolos"
4. "Ahorra 10-15 minutos por conversación = $X/mes"
5. "ROI positivo desde el primer mes"

**Balance perfecto:**
- ✅ No es over-engineering (usa lo que tienes)
- ✅ No es under-engineering (features avanzadas visibles)
- ✅ Es justo lo necesario para impresionar y justificar precio

---

**¿Listo para impresionar en la demo?** 🚀

**Siguiente paso:** Setup de Render PostgreSQL (15 minutos) → Empezar Fase 1


# AI-Generated Workflows: Estrategia y Opciones

## Tu Visión (Lo que propones)

Después del scraping, el sistema **automáticamente sugiere/crea** un workflow completo:

```
Scraping detecta:
- Servicio: "Fisioterapia Deportiva - 50€"
- Servicio: "Masaje Terapéutico - 40€"
- Horario: "Lunes a Viernes 9:00-20:00"

↓ IA GENERA AUTOMÁTICAMENTE ↓

Workflow sugerido:
1. Mensaje Bienvenida: "¡Hola! Soy el asistente de [Nombre Clínica]"
2. Body Map: "¿Dónde sientes dolor?"
3. Si selecciona "Hombro" → Pregunta: "¿Es dolor agudo o crónico?"
4. Sugerir servicio: "Te recomiendo Fisioterapia Deportiva (50€)"
5. Preguntar disponibilidad: "¿Qué día prefieres? Abrimos L-V 9-20h"
6. Confirmar cita
```

---

## Opción 1: Workflow Templates (Rápido - Recomendado para MVP)

### Cómo Funciona

El backend tiene **templates predefinidos** por nicho:

```typescript
// workflow-templates.ts
const PHYSIOTHERAPY_TEMPLATE = {
  nodes: [
    { type: "greeting", config: { message: "Auto-generado" } },
    { type: "body-map", config: { zones: "Auto-detectado" } },
    { type: "branch", config: { on: "body-zone-selected" } },
    { type: "recommend-service", config: { services: "From Knowledge Base" } },
    { type: "schedule", config: { hours: "From Knowledge Base" } },
    { type: "confirm-booking" },
  ],
};
```

### Ventajas

✅ Implementación rápida (1-2 días)
✅ Predecible y confiable
✅ Fácil de testear

### Desventajas

❌ No es "verdadera IA"
❌ Limitado a templates predefinidos

---

## Opción 2: AI-Powered Workflow Generation (Avanzado - El Futuro)

### Cómo Funciona

Usas un LLM (GPT-4) para generar el workflow basándose en el knowledge:

```typescript
// Prompt al LLM
const prompt = `
Eres un experto en diseño de conversaciones para agentes de IA.

Información de la clínica:
${JSON.stringify(knowledgeBase)}

Genera un workflow conversacional óptimo para:
- Capturar el problema del paciente
- Recomendar el servicio adecuado
- Agendar una cita

Devuelve el workflow en formato JSON siguiendo este schema:
{
  nodes: [
    { type: 'greeting', config: {...} },
    { type: 'body-map', config: {...} },
    ...
  ]
}
`;

const workflow = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }],
});
```

### Ventajas

✅ Workflows únicos y optimizados por clínica
✅ Se adapta a cualquier nicho (no solo fisio)
✅ "Wow factor" - verdadera IA

### Desventajas

❌ Más complejo de implementar
❌ Costo de API (GPT-4)
❌ Puede generar workflows impredecibles

---

## Opción 3: Híbrido (RECOMENDADO)

### Cómo Funciona

Combina lo mejor de ambos mundos:

1. **Template Base** (predefinido y confiable)
2. **IA rellena los detalles** (personalización)

```typescript
// 1. Seleccionar template base
const template = getTemplate(niche); // "physiotherapy"

// 2. IA personaliza cada nodo
for (const node of template.nodes) {
  if (node.type === "greeting") {
    node.config.message = await generateGreeting(knowledgeBase);
    // "¡Hola! Soy el asistente de Clínica FisioMadrid..."
  }

  if (node.type === "recommend-service") {
    node.config.services = knowledgeBase.services;
    node.config.logic = await generateRecommendationLogic(knowledgeBase);
    // "Si dolor agudo → Fisioterapia Deportiva"
    // "Si dolor crónico → Masaje Terapéutico"
  }
}
```

### Ventajas

✅ Estructura confiable (template)
✅ Personalización real (IA)
✅ Balance costo/beneficio
✅ Fácil de iterar

---

## UX Propuesta (Workflow Builder)

### Pantalla: "Workflow Sugerido"

```
┌─────────────────────────────────────┐
│  🎯 Workflow Generado Automáticamente│
│                                      │
│  Basado en la información de tu web, │
│  hemos creado este flujo conversacional:│
│                                      │
│  ┌──────────────────────────────┐  │
│  │ 1. Saludo Personalizado      │  │
│  │ "¡Hola! Soy el asistente..." │  │
│  │                        [Editar]│  │
│  └──────────────────────────────┘  │
│           ↓                         │
│  ┌──────────────────────────────┐  │
│  │ 2. Body Map Interactivo      │  │
│  │ "¿Dónde sientes dolor?"      │  │
│  │                        [Editar]│  │
│  └──────────────────────────────┘  │
│           ↓                         │
│  ┌──────────────────────────────┐  │
│  │ 3. Preguntas de Diagnóstico  │  │
│  │ Si Hombro → "¿Agudo o crónico?"│  │
│  │                        [Editar]│  │
│  └──────────────────────────────┘  │
│           ↓                         │
│  ┌──────────────────────────────┐  │
│  │ 4. Recomendación de Servicio │  │
│  │ Fisioterapia Deportiva - 50€ │  │
│  │                        [Editar]│  │
│  └──────────────────────────────┘  │
│                                      │
│  [Usar este Workflow]  [Personalizar]│
└─────────────────────────────────────┘
```

### Dos Caminos

**Camino A: "Usar este Workflow"**

- Click → Va directo al chat
- Workflow ya está activo
- Puede editarlo después desde el Admin Panel

**Camino B: "Personalizar"**

- Click → Abre el Workflow Builder (drag & drop)
- Usuario puede modificar nodos, agregar ramas, etc.
- Guarda y luego va al chat

---

## Implementación Backend (Opción 3 - Híbrido)

### Endpoint Nuevo

```typescript
POST /api/v1/workflow/generate
{
  sourceId: "src-123",
  niche: "physiotherapy"
}

Response:
{
  workflowId: "wf-456",
  nodes: [
    {
      id: "node-1",
      type: "greeting",
      config: {
        message: "¡Hola! Soy el asistente de Clínica FisioMadrid. ¿En qué puedo ayudarte hoy?",
        avatar: "https://...",
        autoGenerated: true
      }
    },
    {
      id: "node-2",
      type: "body-map",
      config: {
        prompt: "¿Dónde sientes dolor?",
        zones: ["shoulder", "back", "knee"], // Detectado del knowledge
        autoGenerated: true
      }
    },
    {
      id: "node-3",
      type: "branch",
      config: {
        conditions: [
          {
            if: "zone === 'shoulder'",
            then: "node-4"
          }
        ],
        autoGenerated: true
      }
    },
    {
      id: "node-4",
      type: "question",
      config: {
        text: "¿Es un dolor agudo (reciente) o crónico (más de 3 meses)?",
        options: ["Agudo", "Crónico"],
        autoGenerated: true
      }
    },
    {
      id: "node-5",
      type: "recommend-service",
      config: {
        services: [
          {
            name: "Fisioterapia Deportiva",
            price: "50€",
            when: "pain_type === 'Agudo'"
          },
          {
            name: "Masaje Terapéutico",
            price: "40€",
            when: "pain_type === 'Crónico'"
          }
        ],
        autoGenerated: true
      }
    }
  ]
}
```

---

## Lógica de Generación (Pseudo-código)

```typescript
async function generateWorkflow(sourceId: string, niche: string) {
  // 1. Obtener knowledge base
  const knowledge = await getKnowledgeSource(sourceId);

  // 2. Seleccionar template base
  const template = TEMPLATES[niche]; // physiotherapy

  // 3. Personalizar cada nodo con IA
  const nodes = [];

  for (const templateNode of template.nodes) {
    const node = { ...templateNode };

    switch (node.type) {
      case "greeting":
        node.config.message = await generateGreeting(knowledge);
        break;

      case "body-map":
        node.config.zones = detectBodyZones(knowledge.services);
        // Si detecta "Fisioterapia Deportiva" → incluye "shoulder", "knee"
        break;

      case "recommend-service":
        node.config.services = knowledge.services;
        node.config.logic = await generateRecommendationRules(knowledge);
        break;

      case "schedule":
        node.config.hours = knowledge.schedule;
        break;
    }

    nodes.push(node);
  }

  // 4. Guardar workflow
  const workflow = await saveWorkflow({ nodes, sourceId, niche });

  return workflow;
}

async function generateGreeting(knowledge: KnowledgeBase): Promise<string> {
  const prompt = `
    Genera un mensaje de bienvenida profesional y cálido para un asistente de IA.
    
    Nombre del negocio: ${knowledge.businessName || "la clínica"}
    Servicios principales: ${knowledge.services.map((s) => s.name).join(", ")}
    
    El mensaje debe:
    - Ser breve (1-2 frases)
    - Mencionar el nombre del negocio
    - Invitar a describir el problema
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100,
  });

  return response.choices[0].message.content;
}
```

---

## Próximos Pasos

### Para implementar esto:

1. **Backend**:

   - Crear templates base por nicho
   - Endpoint `POST /api/v1/workflow/generate`
   - Función `generateWorkflow()` con IA

2. **Frontend**:

   - Pantalla "Workflow Sugerido" (después de Training)
   - Botones "Usar este Workflow" / "Personalizar"
   - Workflow Builder para edición manual

3. **Testing**:
   - Probar con diferentes clínicas
   - Validar que los workflows generados tengan sentido
   - Ajustar prompts de IA

---

## Recomendación Final

**Empieza con Opción 3 (Híbrido)**:

- Crea 1 template para Fisioterapia
- Usa IA solo para personalizar textos (greeting, preguntas)
- No uses IA para la estructura (demasiado impredecible)

Esto te da:
✅ Workflows que funcionan (template confiable)
✅ Personalización real (IA en textos)
✅ Rápido de implementar (1 semana)
✅ Escalable (agregar más templates después)

¿Te gusta este approach?

# 🎯 MVP Simplificado - Booking Agent RAC (Sin Bases de Datos)

## ✅ Enfoque: Funcionalidades Esenciales para Demo

**Razón:** Al principio no habrás muchos usuarios recurrentes, no necesitas bases de datos complejas todavía.

---

## 🚀 Funcionalidades MVP (4-5 días)

### **1. Knowledge Base Inteligente** (1-2 días) ⭐⭐⭐⭐⭐
**Sin base de datos - Solo archivos TypeScript/JSON**

**Qué hace:**
- Al seleccionar parte del cuerpo → Agente muestra información sobre lesiones comunes
- Pregunta síntomas contextuales
- Sugiere tratamiento automáticamente

**Implementación:**
```typescript
// backend/src/agents/booking-agent/domain/knowledge/physio-knowledge.ts
export const PHYSIO_KNOWLEDGE = {
  lumbar: {
    commonInjuries: [
      {
        name: 'Lumbalgia',
        symptoms: ['Dolor zona baja', 'Rigidez matutina'],
        recommendedSessions: 6-8,
        priceRange: { min: 50, max: 70 },
      },
      // ... más lesiones
    ],
  },
  // ... más partes del cuerpo
};
```

**Archivos:**
- `physio-knowledge.ts` (datos)
- `physio-knowledge.service.ts` (acceso a datos)
- `check-injury-info.tool.ts` (tool LangChain)

---

### **2. Información Educativa sobre Opciones Comunes** (1 día) ⭐⭐⭐⭐
**⚠️ CAMBIO IMPORTANTE: No "sugiere", solo "informa"**

**Qué hace:**
- Basado en parte del cuerpo + síntomas
- **Informa** sobre opciones de tratamiento comunes (no prescribe)
- Muestra rango de sesiones típicas (no específicas)
- Precio aproximado (no vinculante)
- **Siempre remite al fisioterapeuta para evaluación**

**Implementación (Más Segura Legalmente):**
```typescript
// inform-treatment-options.tool.ts
export const createInformTreatmentOptionsTool = (knowledgeService) => {
  return new DynamicStructuredTool({
    name: 'inform_treatment_options',
    description: 'Proporciona información educativa sobre opciones de tratamiento comunes para una parte del cuerpo. NO prescribe, solo informa.',
    schema: z.object({
      bodyPart: z.string(),
      symptoms: z.array(z.string()).optional(),
    }),
    func: async (input) => {
      const info = knowledgeService.getTreatmentInfo(
        input.bodyPart,
        input.symptoms || []
      );
      
      // IMPORTANTE: Siempre incluir disclaimer
      return JSON.stringify({
        bodyPart: input.bodyPart,
        commonOptions: info.commonOptions, // "opciones comunes", no "tratamiento recomendado"
        typicalSessionRange: info.typicalSessionRange, // "típicamente 6-8 sesiones", no "necesitas 6 sesiones"
        priceRange: info.priceRange, // "aproximadamente 50-70€", no "cuesta 60€"
        disclaimer: 'Esta información es orientativa. El fisioterapeuta evaluará tu caso específico y determinará el tratamiento más adecuado.',
        nextStep: 'Te recomiendo agendar una consulta para que un profesional evalúe tu caso específico.',
      });
    },
  });
};
```

**Diferencia Clave:**
- ❌ "Te recomiendo fisioterapia de 6 sesiones" → **PELIGROSO**
- ✅ "Los casos similares suelen requerir entre 6-8 sesiones de fisioterapia. El profesional evaluará tu caso específico" → **SEGURO**

---

### **3. Preguntas Contextuales** (1 día) ⭐⭐⭐
**Solo mejora el prompt - No requiere código nuevo**

**Qué hace:**
- El agente hace preguntas específicas según la parte del cuerpo
- Mejora la calidad de la conversación

**Implementación:**
```typescript
// En booking-agent-chain.service.ts
// Agregar al system prompt:
const contextualQuestions = {
  lumbar: [
    "¿Cuándo comenzó el dolor?",
    "¿Es constante o aparece con ciertos movimientos?",
  ],
  // ... más
};

const systemPrompt = `...
ESPECIALIZACIÓN EN FISIOTERAPIA:
- Cuando el cliente selecciona una parte del cuerpo, usa check_injury_info
- Haz preguntas contextuales: ${JSON.stringify(contextualQuestions)}
...`;
```

---

## 📋 Checklist de Implementación

### **Día 1: Knowledge Base**
- [ ] Crear `physio-knowledge.ts` con datos estructurados
- [ ] Crear `physio-knowledge.service.ts`
- [ ] Agregar 20-30 lesiones comunes (5-6 partes del cuerpo)

### **Día 2: Tool check_injury_info**
- [ ] Crear `check-injury-info.tool.ts`
- [ ] Integrar en `booking-agent-chain.service.ts`
- [ ] Test: Seleccionar "lumbar" → Agente muestra información

### **Día 3: Tool suggest_treatment**
- [ ] Crear `suggest-treatment.tool.ts`
- [ ] Integrar en el agente
- [ ] Test: Agente sugiere tratamiento automáticamente

### **Día 4: Preguntas Contextuales**
- [ ] Agregar preguntas al system prompt
- [ ] Test: Agente hace preguntas inteligentes

### **Día 5: Testing y Refinamiento**
- [ ] Probar flujo completo
- [ ] Ajustar prompts
- [ ] Preparar demo

---

## 🎬 Para la Demo

### **Flujo de Demo (3-4 minutos):**

1. **"Mira cómo entiende el contexto"** (1 min)
   - Seleccionar "lumbar" en el mapa
   - Agente inmediatamente muestra información
   - Agente hace preguntas contextuales

2. **"Sugerencias automáticas"** (1 min)
   - Agente sugiere tratamiento
   - Muestra precio y sesiones
   - Usuario acepta

3. **"Booking automático"** (1 min)
   - Agente consulta disponibilidad
   - Sugiere horarios
   - Confirma cita

4. **Cierre** (30 seg)
   - "Todo esto automáticamente, sin que tu equipo tenga que explicar lo mismo 50 veces al día"

---

## ✅ Ventajas de este MVP

1. **Sin bases de datos:** Todo en memoria/archivos
2. **Rápido de implementar:** 4-5 días
3. **Impactante para demo:** Muestra inteligencia
4. **Escalable:** Fácil agregar más datos después
5. **Sin over-engineering:** Solo lo esencial

---

## 🔮 Futuro (Cuando Tengas Usuarios)

### **Cuando implementar Historial:**
- Cuando tengas 50+ usuarios recurrentes
- Cuando quieras mostrar personalización avanzada
- Cuando necesites base de datos de todos modos

### **Cuando implementar Métricas:**
- Cuando tengas usuarios reales usando el sistema
- Cuando quieras mostrar ROI detallado
- Cuando necesites tracking persistente

**Por ahora:** ❌ **NO necesitas estas funcionalidades**

---

## 🎯 Resultado Final

**Tendrás:**
- ✅ Agente inteligente que entiende contexto médico
- ✅ Sugerencias automáticas de tratamiento
- ✅ Preguntas contextuales inteligentes
- ✅ Todo funcionando sin bases de datos
- ✅ Perfecto para demo a nuevos clientes

**Tiempo total:** 4-5 días
**Complejidad:** Baja
**Impacto:** Alto

---

**¿Listo para empezar?** 🚀


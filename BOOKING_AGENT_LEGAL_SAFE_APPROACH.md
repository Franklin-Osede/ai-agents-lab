# ⚖️ Enfoque Legalmente Seguro - Booking Agent Fisioterapeuta

## ⚠️ Problema Identificado

**Riesgo Legal:** Sugerir tratamientos automáticamente puede:
- ❌ Ser considerado práctica médica no autorizada
- ❌ Crear responsabilidad legal si el tratamiento no funciona
- ❌ Violar regulaciones de salud en muchos países
- ❌ Generar expectativas incorrectas en el paciente

**Solución:** Cambiar de "sugerir tratamiento" a "informar sobre opciones comunes"

---

## ✅ Enfoque Legalmente Seguro

### **1. Información Educativa (No Prescripción)**

#### **❌ NO Hacer:**
```
"Te recomiendo un tratamiento de fisioterapia de 6 sesiones 
a 60€ cada una. El tratamiento completo sería de 360€."
```

**Por qué es peligroso:**
- Prescribe tratamiento específico
- Establece expectativas de precio vinculantes
- No deja espacio para evaluación profesional

---

#### **✅ SÍ Hacer:**
```
"Basado en los síntomas que describes, los casos similares 
suelen requerir entre 6-8 sesiones de fisioterapia. 

Cada sesión típicamente dura 45 minutos y tiene un precio 
aproximado de entre 50-70€, aunque esto puede variar según 
tu caso específico.

⚠️ IMPORTANTE: Esta información es orientativa. El fisioterapeuta 
evaluará tu caso en la primera consulta y determinará el 
tratamiento más adecuado para ti. Los precios finales serán 
confirmados después de la evaluación profesional.

¿Te gustaría agendar una consulta para que un profesional 
evalúe tu caso específico?"
```

**Por qué es seguro:**
- ✅ Solo informa sobre casos similares (no prescribe)
- ✅ Usa rangos ("6-8 sesiones", no "6 sesiones")
- ✅ Precios aproximados (no vinculantes)
- ✅ Siempre remite a evaluación profesional
- ✅ Disclaimer claro y visible

---

### **2. Estructura de Datos Segura**

```typescript
// physio-knowledge.ts - Estructura Legalmente Segura
export const PHYSIO_KNOWLEDGE = {
  lumbar: {
    commonInjuries: [
      {
        name: 'Lumbalgia',
        symptoms: ['Dolor zona baja', 'Rigidez matutina'],
        // ✅ Rangos, no valores específicos
        typicalSessionRange: { min: 6, max: 8 },
        typicalDuration: '2-6 semanas',
        // ✅ Opciones comunes, no "tratamiento recomendado"
        commonTreatmentOptions: [
          {
            type: 'Fisioterapia',
            description: 'Técnicas de movilización y fortalecimiento',
            typicalSessions: '6-8 sesiones',
            priceRange: { min: 50, max: 70 },
          },
          {
            type: 'Masaje terapéutico',
            description: 'Para alivio de tensión muscular',
            typicalSessions: '4-6 sesiones',
            priceRange: { min: 40, max: 60 },
          },
        ],
        // ✅ Disclaimer obligatorio
        disclaimer: 'Esta información es orientativa. Consulta profesional requerida.',
      },
    ],
  },
};
```

---

### **3. Tool LangChain Segura**

```typescript
// inform-treatment-options.tool.ts
export const createInformTreatmentOptionsTool = (knowledgeService) => {
  return new DynamicStructuredTool({
    name: 'inform_treatment_options',
    description: `Proporciona información educativa sobre opciones de tratamiento 
                  comunes. NUNCA prescribes tratamiento específico. Siempre incluye 
                  disclaimer y remite a evaluación profesional.`,
    schema: z.object({
      bodyPart: z.string(),
      symptoms: z.array(z.string()).optional(),
    }),
    func: async (input) => {
      const info = knowledgeService.getTreatmentInfo(
        input.bodyPart,
        input.symptoms || []
      );
      
      // Construir respuesta segura
      const response = {
        bodyPart: input.bodyPart,
        educationalInfo: {
          commonOptions: info.commonTreatmentOptions,
          typicalSessionRange: `${info.typicalSessionRange.min}-${info.typicalSessionRange.max} sesiones`,
          note: 'Estos son rangos típicos basados en casos similares. Tu caso puede variar.',
        },
        priceInfo: {
          range: info.priceRange,
          note: 'Precios aproximados. Confirmar con profesional después de evaluación.',
        },
        // ✅ Disclaimer obligatorio
        disclaimer: 'Esta información es orientativa y educativa. No constituye una prescripción médica ni sustituye una consulta profesional. El fisioterapeuta evaluará tu caso específico y determinará el tratamiento más adecuado.',
        nextStep: 'Te recomiendo agendar una consulta para evaluación profesional.',
      };
      
      return JSON.stringify(response);
    },
  });
};
```

---

### **4. System Prompt Actualizado (Seguro)**

```typescript
// En booking-agent-chain.service.ts
const systemPrompt = `...
ESPECIALIZACIÓN EN FISIOTERAPIA - REGLAS CRÍTICAS:

1. NUNCA prescribas tratamiento específico
2. NUNCA digas "necesitas X sesiones" - di "típicamente se requieren X-Y sesiones"
3. NUNCA digas "el precio es X" - di "el precio aproximado es entre X-Y"
4. SIEMPRE incluye disclaimer después de información médica
5. SIEMPRE remite a evaluación profesional
6. Usa lenguaje educativo, no prescriptivo

EJEMPLOS CORRECTOS:
- "Los casos similares suelen requerir entre 6-8 sesiones"
- "El precio aproximado es de 50-70€ por sesión"
- "El fisioterapeuta evaluará tu caso y determinará el mejor tratamiento"

EJEMPLOS INCORRECTOS (NUNCA HAGAS ESTO):
- "Te recomiendo 6 sesiones de fisioterapia"
- "El tratamiento cuesta 360€"
- "Necesitas este tratamiento específico"
...`;
```

---

## 🎯 Funcionalidades Seguras (Reformuladas)

### **Funcionalidad 1: Información Educativa sobre Lesiones**
**En lugar de:** "Sugerir diagnóstico"
**Hacer:** "Informar sobre lesiones comunes y síntomas típicos"

```
✅ "Las causas más comunes de dolor lumbar incluyen lumbalgia, 
   hernia discal, y ciática. ¿Sientes alguno de estos síntomas?"
   
❌ "Tienes lumbalgia"
```

---

### **Funcionalidad 2: Opciones de Tratamiento Comunes**
**En lugar de:** "Sugerir tratamiento específico"
**Hacer:** "Informar sobre opciones comunes con rangos típicos"

```
✅ "Para casos similares, las opciones comunes incluyen fisioterapia 
   (típicamente 6-8 sesiones) o masaje terapéutico (4-6 sesiones). 
   El fisioterapeuta evaluará cuál es mejor para ti."
   
❌ "Te recomiendo fisioterapia de 6 sesiones"
```

---

### **Funcionalidad 3: Precios Aproximados**
**En lugar de:** "Precio específico"
**Hacer:** "Rango de precios aproximados"

```
✅ "El precio aproximado por sesión es de entre 50-70€, aunque 
   esto puede variar según tu caso específico. El precio final 
   será confirmado después de la evaluación."
   
❌ "Cada sesión cuesta 60€"
```

---

## 📋 Checklist Legal

### **En cada respuesta médica:**
- [ ] Usa lenguaje educativo, no prescriptivo
- [ ] Usa rangos, no valores específicos
- [ ] Incluye disclaimer visible
- [ ] Remite a evaluación profesional
- [ ] No hace diagnósticos
- [ ] No prescribe tratamientos
- [ ] No garantiza resultados

### **En cada mención de precio:**
- [ ] Dice "aproximado" o "típicamente"
- [ ] Usa rangos (min-max)
- [ ] Menciona que puede variar
- [ ] Confirma que precio final será después de evaluación

### **En cada sugerencia:**
- [ ] Dice "opciones comunes" no "tratamiento recomendado"
- [ ] Menciona que el profesional decidirá
- [ ] Siempre incluye disclaimer

---

## 🎬 Para la Demo (Versión Segura)

### **Script de Demo Actualizado:**

1. **"Información Educativa"** (1 min)
   - Seleccionar "lumbar"
   - Agente: "Las causas más comunes son... ¿Sientes alguno de estos síntomas?"
   - **Mensaje:** "El agente informa, no diagnostica"

2. **"Opciones Comunes"** (1 min)
   - Agente: "Para casos similares, las opciones comunes incluyen... El profesional evaluará cuál es mejor"
   - **Mensaje:** "Informa sobre opciones, siempre remite a profesional"

3. **"Precios Aproximados"** (1 min)
   - Agente: "El precio aproximado es entre 50-70€. Se confirmará después de evaluación"
   - **Mensaje:** "Transparencia sin compromisos vinculantes"

4. **Cierre** (30 seg)
   - "El agente informa y educa, pero siempre remite al profesional. Cumple con todas las regulaciones médicas."

---

## ✅ Ventajas del Enfoque Seguro

1. **Legalmente protegido:** No hay riesgo de práctica médica no autorizada
2. **Éticamente correcto:** Respeta el rol del profesional
3. **Mejor UX:** El cliente se siente informado, no presionado
4. **Más confiable:** Transparencia genera confianza
5. **Cumple regulaciones:** Compatible con leyes de salud

---

## 🔄 Cambios Necesarios en el Plan

### **Antes (Peligroso):**
- Tool: `suggest_treatment` → Sugiere tratamiento específico
- Respuesta: "Te recomiendo 6 sesiones a 60€"

### **Ahora (Seguro):**
- Tool: `inform_treatment_options` → Informa sobre opciones comunes
- Respuesta: "Los casos similares suelen requerir 6-8 sesiones. Precio aproximado 50-70€. El profesional evaluará tu caso."

---

**¿Quieres que actualice el plan de implementación con este enfoque seguro?** ⚖️


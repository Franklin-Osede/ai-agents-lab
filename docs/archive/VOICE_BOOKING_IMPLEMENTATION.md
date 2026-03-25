# Voice-First Booking Agent Implementation

## Architecture

### Flow Structure

```
Service Selection → Voice Questions → Button Responses → Calendar → Confirmation
```

### Key Components

1. **Voice Playback**

   - Use `VoiceService.generateGreeting()` for TTS
   - Auto-play agent questions
   - Spanish (Spain) accent with random gender

2. **Button Options**

   - Replace text input with button groups
   - 2-4 options per question
   - Niche-specific options

3. **Conversation Flow**
   - Agent asks question (voice)
   - User clicks button
   - Next question triggered
   - Continue until booking complete

## Niche-Specific Flows

### Dentist

```
Q1: "¿En qué puedo ayudarte?"
→ [Agendar] [Modificar] [Cancelar]

Q2: "¿Qué tipo de consulta?"
→ [Revisión] [Limpieza] [Urgencia] [Ortodoncia]

Q3: "¿Qué molestia tienes?"
→ [Dolor] [Sangrado] [Diente roto]

→ Calendar
```

### Doctor

```
Q1: "¿Cómo puedo ayudarte?"
→ [Agendar] [Modificar] [Cancelar]

Q2: "¿Qué especialidad?"
→ [General] [Cardiología] [Traumatología] [Pediatría]

Q3: "¿Primera vez o seguimiento?"
→ [Primera vez] [Seguimiento] [Urgente]

Q4: "¿Síntoma específico?"
→ [Fiebre/Gripe] [Receta] [Chequeo] [Otro]

→ Calendar
```

## Implementation Steps

1. ✅ Add VoiceService to demo-modal
2. ⏳ Create voice question component
3. ⏳ Replace text input with button groups
4. ⏳ Implement conversation state machine
5. ⏳ Test all niches

## Technical Details

- **Component**: `demo-modal.component.ts`
- **Service**: `VoiceService` (already exists)
- **State**: Add `conversationStep` tracking
- **Audio**: Auto-play on question load
- **Buttons**: Material buttons with icons

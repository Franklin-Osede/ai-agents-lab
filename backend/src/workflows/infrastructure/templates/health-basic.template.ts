import { WorkflowTemplate } from '../../domain/entities/workflow-template.entity';
import { TemplateNiche } from '../../domain/value-objects/template-niche.vo';
import { TemplateIntent } from '../../domain/value-objects/template-intent.vo';

export const healthBasicTemplate = WorkflowTemplate.create({
  niche: TemplateNiche.create('health', 'clinic'),
  name: 'Agente de Salud Básico',
  description:
    'Workflow completo para clínicas médicas con agendamiento, consulta de dolor y precios',
  defaultIntents: [
    TemplateIntent.create({
      name: 'schedule_appointment',
      displayName: 'Agendar cita',
      examples: ['quiero agendar', 'necesito cita', 'reservar consulta', 'pedir hora'],
      icon: '📅',
      description: 'El usuario quiere agendar una cita médica',
    }),
    TemplateIntent.create({
      name: 'pain_consultation',
      displayName: 'Consulta de dolor',
      examples: ['me duele', 'tengo dolor', 'siento molestia', 'me lastimé'],
      icon: '🩺',
      description: 'El usuario tiene dolor y necesita consulta',
    }),
    TemplateIntent.create({
      name: 'pricing_inquiry',
      displayName: 'Consulta de precios',
      examples: ['cuánto cuesta', 'precios', 'tarifas', 'cuánto vale'],
      icon: '💰',
      description: 'El usuario pregunta por precios de servicios',
    }),
    TemplateIntent.create({
      name: 'emergency',
      displayName: 'Urgencia médica',
      examples: ['urgente', 'emergencia', 'es grave', 'necesito ayuda ya'],
      icon: '🚨',
      description: 'Situación de urgencia médica',
    }),
  ],
  nodes: [
    {
      id: 'greeting-1',
      type: 'voicenote',
      label: 'Saludo Inicial',
      position: { x: 0, y: 0 },
      data: {
        text: '¡Hola! Soy {agentName}, tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        voiceGender: 'female',
        voiceId: 'Lucia',
      },
    },
    {
      id: 'smartlisten-1',
      type: 'smartlisten',
      label: 'Escucha Inteligente',
      position: { x: 0, y: 100 },
      data: {
        intents: [
          {
            intentName: 'schedule_appointment',
            keywords: ['agendar', 'cita', 'reservar'],
            nextSteps: [
              {
                id: 'services-1',
                type: 'services',
                label: 'Seleccionar Servicio',
                position: { x: 0, y: 0 },
                data: {},
              },
              {
                id: 'calendar-1',
                type: 'calendar',
                label: 'Seleccionar Fecha',
                position: { x: 0, y: 100 },
                data: {},
              },
              {
                id: 'payment-1',
                type: 'payment',
                label: 'Pago de Señal',
                position: { x: 0, y: 200 },
                data: {
                  amount: 20,
                  currency: 'EUR',
                  concept: 'Señal de reserva',
                },
              },
              {
                id: 'confirm-1',
                type: 'confirm',
                label: 'Confirmación',
                position: { x: 0, y: 300 },
                data: {
                  confirmText: '¡Perfecto! Tu cita ha sido agendada. Te esperamos.',
                },
              },
            ],
          },
          {
            intentName: 'pain_consultation',
            keywords: ['dolor', 'duele', 'molestia'],
            nextSteps: [
              {
                id: 'bodymap-1',
                type: 'bodymap',
                label: 'Mapa Corporal',
                position: { x: 0, y: 0 },
                data: {
                  bodyView: 'front',
                  successMessage:
                    'Entiendo, te duele {body_part}. Déjame revisar qué podemos hacer.',
                },
              },
              {
                id: 'ragsearch-1',
                type: 'ragsearch',
                label: 'Búsqueda de Tratamiento',
                position: { x: 0, y: 100 },
                data: {
                  searchQuery: 'Tratamientos para dolor en {body_part}',
                },
              },
              {
                id: 'services-2',
                type: 'services',
                label: 'Servicios Recomendados',
                position: { x: 0, y: 200 },
                data: {},
              },
              {
                id: 'calendar-2',
                type: 'calendar',
                label: 'Agendar Consulta',
                position: { x: 0, y: 300 },
                data: {},
              },
            ],
          },
          {
            intentName: 'pricing_inquiry',
            keywords: ['precio', 'cuesta', 'tarifa'],
            nextSteps: [
              {
                id: 'ragsearch-2',
                type: 'ragsearch',
                label: 'Búsqueda de Precios',
                position: { x: 0, y: 0 },
                data: {
                  searchQuery: 'Precios de servicios',
                },
              },
            ],
          },
          {
            intentName: 'emergency',
            keywords: ['urgente', 'emergencia', 'grave'],
            nextSteps: [
              {
                id: 'message-1',
                type: 'message',
                label: 'Mensaje de Urgencia',
                position: { x: 0, y: 0 },
                data: {
                  text: 'Para urgencias médicas, por favor llama directamente al teléfono de emergencias: 555-123-456',
                },
              },
            ],
          },
        ],
      },
    },
  ],
  isPublic: true,
});

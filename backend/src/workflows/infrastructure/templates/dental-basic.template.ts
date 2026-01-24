import { WorkflowTemplate } from '../../domain/entities/workflow-template.entity';
import { TemplateNiche } from '../../domain/value-objects/template-niche.vo';
import { TemplateIntent } from '../../domain/value-objects/template-intent.vo';

export const dentalBasicTemplate = WorkflowTemplate.create({
  niche: TemplateNiche.create('dental', 'clinic'),
  name: 'Clínica Dental',
  description:
    'Asistente especializado para clínicas dentales. Gestiona revisiones, limpiezas y urgencias.',
  defaultIntents: [
    TemplateIntent.create({
      name: 'dental_checkup',
      displayName: 'Revisión Dental',
      examples: ['revision', 'chequeo', 'mirar muela', 'diente roto'],
      icon: '🦷',
      description: 'El usuario quiere una revisión dental',
    }),
    TemplateIntent.create({
      name: 'cleaning',
      displayName: 'Limpieza Dental',
      examples: ['limpieza', 'higiene', 'quitar sarro'],
      icon: '✨',
      description: 'El usuario solicita una limpieza',
    }),
    TemplateIntent.create({
      name: 'orthodontics',
      displayName: 'Ortodoncia',
      examples: ['brackets', 'invisalign', 'alineadores', 'dientes torcidos'],
      icon: '😁',
      description: 'Consultas sobre ortodoncia',
    }),
    TemplateIntent.create({
      name: 'emergency',
      displayName: 'Urgencia',
      examples: ['dolor insoportable', 'sangre', 'diente caído'],
      icon: '🚨',
      description: 'Urgencia dental',
    }),
  ],
  nodes: [
    {
      id: 'greeting-1',
      type: 'voicenote',
      label: 'Saludo Inicial',
      position: { x: 0, y: 0 },
      data: {
        text: '¡Hola! Bienvenido a {agentName}. Soy tu asistente dental. ¿Te duele algo o vienes a revisión?',
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
            intentName: 'dental_checkup',
            keywords: ['revision', 'chequeo', 'diente', 'muela'],
            nextSteps: [
              {
                id: 'services-1',
                type: 'services',
                label: 'Tratamientos Dentales',
                position: { x: 0, y: 0 },
                data: { filterTags: ['dental', 'general'] },
              },
              {
                id: 'calendar-1',
                type: 'calendar',
                label: 'Cita Revisión',
                position: { x: 0, y: 100 },
                data: {},
              },
            ],
          },
          {
            intentName: 'cleaning',
            keywords: ['limpieza', 'higiene'],
            nextSteps: [
              {
                id: 'msg-cleaning',
                type: 'message',
                label: 'Info Limpieza',
                position: { x: 0, y: 0 },
                data: {
                  text: 'La limpieza dura 40min. ¿Te agendo cita?',
                },
              },
              {
                id: 'calendar-2',
                type: 'calendar',
                label: 'Cita Limpieza',
                position: { x: 0, y: 100 },
                data: {},
              },
            ],
          },
          {
            intentName: 'emergency',
            keywords: ['dolor', 'urgencia'],
            nextSteps: [
              {
                id: 'msg-urgency',
                type: 'message',
                label: 'Mensaje Urgencia',
                position: { x: 0, y: 0 },
                data: {
                  text: 'Para urgencias llama al teléfono de guardia: 600-111-222',
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

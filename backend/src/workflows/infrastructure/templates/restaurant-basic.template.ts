import { WorkflowTemplate } from '../../domain/entities/workflow-template.entity';
import { TemplateNiche } from '../../domain/value-objects/template-niche.vo';
import { TemplateIntent } from '../../domain/value-objects/template-intent.vo';

export const restaurantBasicTemplate = WorkflowTemplate.create({
  niche: TemplateNiche.create('restaurant'),
  name: 'Agente de Restaurante Básico',
  description: 'Workflow para reservas de mesa y pedidos a domicilio',
  defaultIntents: [
    TemplateIntent.create({
      name: 'make_reservation',
      displayName: 'Reservar mesa',
      examples: ['reservar mesa', 'quiero reservar', 'hacer reserva', 'mesa para'],
      icon: '🪑',
      description: 'El usuario quiere reservar una mesa',
    }),
    TemplateIntent.create({
      name: 'order_delivery',
      displayName: 'Pedir delivery',
      examples: ['pedir comida', 'delivery', 'a domicilio', 'llevar a casa'],
      icon: '🛵',
      description: 'El usuario quiere pedir comida a domicilio',
    }),
    TemplateIntent.create({
      name: 'menu_inquiry',
      displayName: 'Ver menú',
      examples: ['ver menú', 'qué tienen', 'carta', 'platos'],
      icon: '📋',
      description: 'El usuario quiere ver el menú',
    }),
  ],
  nodes: [
    {
      id: 'greeting-1',
      type: 'voicenote',
      label: 'Saludo',
      position: { x: 0, y: 0 },
      data: {
        text: '¡Bienvenido a {agentName}! ¿En qué puedo ayudarte?',
        voiceGender: 'female',
      },
    },
    {
      id: 'smartlisten-1',
      type: 'smartlisten',
      label: 'Escucha',
      position: { x: 0, y: 100 },
      data: {
        intents: [
          {
            intentName: 'make_reservation',
            keywords: ['reservar', 'mesa', 'reserva'],
            nextSteps: [
              {
                id: 'calendar-1',
                type: 'calendar',
                label: 'Fecha y Hora',
                position: { x: 0, y: 0 },
                data: {},
              },
              {
                id: 'form-1',
                type: 'form',
                label: 'Datos de Reserva',
                position: { x: 0, y: 100 },
                data: {
                  fields: [
                    { label: 'Nombre', type: 'text', required: true },
                    { label: 'Teléfono', type: 'phone', required: true },
                    { label: 'Número de personas', type: 'number', required: true },
                  ],
                },
              },
              {
                id: 'confirm-1',
                type: 'confirm',
                label: 'Confirmación',
                position: { x: 0, y: 200 },
                data: {
                  confirmText: '¡Reserva confirmada! Te esperamos.',
                },
              },
            ],
          },
          {
            intentName: 'order_delivery',
            keywords: ['delivery', 'domicilio', 'pedir'],
            nextSteps: [
              {
                id: 'services-1',
                type: 'services',
                label: 'Seleccionar Platos',
                position: { x: 0, y: 0 },
                data: {},
              },
              {
                id: 'form-2',
                type: 'form',
                label: 'Dirección de Entrega',
                position: { x: 0, y: 100 },
                data: {
                  fields: [
                    { label: 'Dirección', type: 'text', required: true },
                    { label: 'Teléfono', type: 'phone', required: true },
                  ],
                },
              },
              {
                id: 'payment-1',
                type: 'payment',
                label: 'Pago',
                position: { x: 0, y: 200 },
                data: {
                  currency: 'EUR',
                  concept: 'Pedido a domicilio',
                },
              },
            ],
          },
          {
            intentName: 'menu_inquiry',
            keywords: ['menú', 'carta', 'platos'],
            nextSteps: [
              {
                id: 'ragsearch-1',
                type: 'ragsearch',
                label: 'Mostrar Menú',
                position: { x: 0, y: 0 },
                data: {
                  searchQuery: 'Menú del restaurante',
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

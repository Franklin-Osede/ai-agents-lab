import { WorkflowTemplate } from '../entities/workflow-template.entity';
import { TemplateNiche, NicheType } from '../value-objects/template-niche.vo';
import { TemplateIntent } from '../value-objects/template-intent.vo';

describe('WorkflowTemplate Domain', () => {
  describe('WorkflowTemplate Entity', () => {
    it('should create a valid health template', () => {
      const niche = TemplateNiche.create('health', 'clinic');
      const template = WorkflowTemplate.create({
        niche,
        name: 'Agente de Salud Básico',
        description: 'Workflow completo para clínicas médicas',
        defaultIntents: [
          TemplateIntent.create({
            name: 'schedule_appointment',
            displayName: 'Agendar cita',
            examples: ['quiero agendar', 'necesito cita'],
            icon: '📅',
          }),
        ],
        nodes: [
          {
            id: '1',
            type: 'voicenote',
            label: 'Saludo',
            position: { x: 0, y: 0 },
            data: { text: 'Hola' },
          },
        ],
      });

      expect(template).toBeDefined();
      expect(template.niche.type).toBe('health');
      expect(template.defaultIntents).toHaveLength(1);
    });

    it('should validate required fields', () => {
      expect(() => {
        WorkflowTemplate.create({
          niche: null as unknown as TemplateNiche,
          name: '',
          description: '',
          defaultIntents: [],
          nodes: [],
        });
      }).toThrow();
    });

    it('should customize template with user preferences', () => {
      const niche = TemplateNiche.create('health', 'clinic');
      const template = WorkflowTemplate.create({
        niche,
        name: 'Agente de Salud Básico',
        description: 'Workflow completo para clínicas médicas',
        defaultIntents: [
          TemplateIntent.create({
            name: 'schedule_appointment',
            displayName: 'Agendar cita',
            examples: ['quiero agendar'],
            icon: '📅',
          }),
          TemplateIntent.create({
            name: 'pricing',
            displayName: 'Precios',
            examples: ['cuánto cuesta'],
            icon: '💰',
          }),
        ],
        nodes: [
          {
            id: '1',
            type: 'voicenote',
            label: 'Saludo',
            position: { x: 0, y: 0 },
            data: { text: 'Hola, soy {agentName}' },
          },
          {
            id: '2',
            type: 'smartlisten',
            label: 'Escucha',
            position: { x: 0, y: 100 },
            data: {
              intents: [
                { intentName: 'schedule_appointment', keywords: ['agendar'], nextSteps: [] },
                { intentName: 'pricing', keywords: ['precio'], nextSteps: [] },
              ],
            },
          },
        ],
      });

      const customized = template.customize({
        agentName: 'Dr. García',
        greeting: '¡Hola! Soy el Dr. García',
        enabledIntents: ['schedule_appointment'], // Only enable one
        customIntents: [],
      });

      expect(customized.nodes[0].data?.text).toContain('Dr. García');
      // Should only have enabled intents
      const smartListenNode = customized.nodes.find((n) => n.type === 'smartlisten');
      expect(smartListenNode?.data?.intents).toHaveLength(1);
      expect(smartListenNode?.data?.intents[0].intentName).toBe('schedule_appointment');
    });
  });

  describe('TemplateNiche Value Object', () => {
    it('should create valid niche', () => {
      const niche = TemplateNiche.create('health', 'clinic');
      expect(niche.type).toBe('health');
      expect(niche.subtype).toBe('clinic');
    });

    it('should return default intents for health niche', () => {
      const niche = TemplateNiche.create('health');
      const intents = niche.getDefaultIntents();

      expect(intents.length).toBeGreaterThan(0);
      expect(intents.some((i) => i.name === 'schedule_appointment')).toBe(true);
      expect(intents.some((i) => i.name === 'pain_consultation')).toBe(true);
    });

    it('should return default intents for restaurant niche', () => {
      const niche = TemplateNiche.create('restaurant');
      const intents = niche.getDefaultIntents();

      expect(intents.some((i) => i.name === 'make_reservation')).toBe(true);
      expect(intents.some((i) => i.name === 'order_delivery')).toBe(true);
    });

    it('should validate niche type', () => {
      expect(() => {
        TemplateNiche.create('invalid' as unknown as NicheType);
      }).toThrow('Invalid niche type');
    });
  });

  describe('TemplateIntent Value Object', () => {
    it('should create valid intent', () => {
      const intent = TemplateIntent.create({
        name: 'schedule_appointment',
        displayName: 'Agendar cita',
        examples: ['quiero agendar', 'necesito cita'],
        icon: '📅',
      });

      expect(intent.name).toBe('schedule_appointment');
      expect(intent.examples).toHaveLength(2);
    });

    it('should validate required fields', () => {
      expect(() => {
        TemplateIntent.create({
          name: '',
          displayName: '',
          examples: [],
          icon: '',
        });
      }).toThrow();
    });

    it('should match user input', () => {
      const intent = TemplateIntent.create({
        name: 'schedule_appointment',
        displayName: 'Agendar cita',
        examples: ['quiero agendar', 'necesito cita', 'reservar'],
        icon: '📅',
      });

      expect(intent.matches('quiero agendar una cita')).toBe(true);
      expect(intent.matches('necesito cita urgente')).toBe(true);
      expect(intent.matches('hola')).toBe(false);
    });
  });
});

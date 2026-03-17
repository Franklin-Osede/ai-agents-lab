import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TemplateNiche, NicheType } from '../value-objects/template-niche.vo';
import { TemplateIntent } from '../value-objects/template-intent.vo';

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data?: Record<string, any>;
  next_node_id?: string;
}

export interface TemplateCustomization {
  agentName?: string;
  greeting?: string;
  enabledIntents?: string[]; // Intent names to enable
  customIntents?: Array<{
    name: string;
    displayName: string;
    examples: string[];
    icon?: string;
  }>;
  voiceId?: string;
  primaryColor?: string;
}

export interface CreateTemplateProps {
  niche: TemplateNiche;
  name: string;
  description: string;
  defaultIntents: TemplateIntent[];
  nodes: WorkflowNode[];
  isPublic?: boolean;
}

@Entity('workflow_templates')
export class WorkflowTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  nicheType: NicheType;

  @Column({ nullable: true, type: 'varchar' })
  nicheSubtype?: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb' })
  defaultIntents: any[]; // Stored as JSON, plain objects

  @Column({ type: 'jsonb' })
  nodes: WorkflowNode[];

  @Column({ default: true })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Domain properties (not persisted)
  private _niche?: TemplateNiche;
  private _intents?: TemplateIntent[];

  // Factory method
  static create(props: CreateTemplateProps): WorkflowTemplate {
    if (!props.name || !props.description) {
      throw new Error('Template name and description are required');
    }
    if (!props.niche) {
      throw new Error('Template niche is required');
    }
    if (!props.nodes || props.nodes.length === 0) {
      throw new Error('Template must have at least one node');
    }

    const template = new WorkflowTemplate();
    template.nicheType = props.niche.type;
    template.nicheSubtype = props.niche.subtype;
    template.name = props.name;
    template.description = props.description;
    template.defaultIntents = props.defaultIntents.map((i) => i.toJSON());
    template.nodes = props.nodes;
    template.isPublic = props.isPublic ?? true;

    template._niche = props.niche;
    template._intents = props.defaultIntents;

    return template;
  }

  // Getters for domain objects
  get niche(): TemplateNiche {
    if (!this._niche) {
      this._niche = TemplateNiche.create(this.nicheType, this.nicheSubtype);
    }
    return this._niche;
  }

  get intents(): TemplateIntent[] {
    if (!this._intents) {
      this._intents = this.defaultIntents.map((i) => TemplateIntent.create(i));
    }
    return this._intents;
  }

  // Business logic: Customize template
  customize(customization: TemplateCustomization): { nodes: WorkflowNode[] } {
    let customizedNodes = JSON.parse(JSON.stringify(this.nodes)); // Deep clone

    // 1. Replace agent name and greeting in VoiceNote nodes
    if (customization.agentName || customization.greeting) {
      customizedNodes = customizedNodes.map((node: WorkflowNode) => {
        if (node.type === 'voicenote' && node.data?.text) {
          let text = node.data.text;

          if (customization.greeting && node.id === customizedNodes[0]?.id) {
            // Replace first voicenote with custom greeting
            text = customization.greeting;
          } else if (customization.agentName) {
            // Replace placeholder agent name
            text = text.replace(/\{agentName\}/g, customization.agentName);
            text = text.replace(/Asistente Virtual/g, customization.agentName);
          }

          return { ...node, data: { ...node.data, text } };
        }
        return node;
      });
    }

    // 2. Filter intents in SmartListen nodes
    if (customization.enabledIntents) {
      customizedNodes = customizedNodes.map((node: WorkflowNode) => {
        if (node.type === 'smartlisten' && node.data?.intents) {
          const filteredIntents = node.data.intents.filter((intent: any) =>
            customization.enabledIntents!.includes(intent.intentName),
          );

          // Add custom intents
          if (customization.customIntents) {
            customization.customIntents.forEach((custom) => {
              filteredIntents.push({
                intentName: custom.name,
                keywords: custom.examples,
                nextSteps: [],
              });
            });
          }

          return { ...node, data: { ...node.data, intents: filteredIntents } };
        }
        return node;
      });
    }

    // 3. Apply voice and color preferences
    if (customization.voiceId) {
      customizedNodes = customizedNodes.map((node: WorkflowNode) => {
        if (node.type === 'voicenote') {
          return { ...node, data: { ...node.data, voiceId: customization.voiceId } };
        }
        return node;
      });
    }

    return { nodes: customizedNodes };
  }

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name) errors.push('Template name is required');
    if (!this.description) errors.push('Template description is required');
    if (!this.nodes || this.nodes.length === 0) {
      errors.push('Template must have at least one node');
    }
    if (!this.defaultIntents || this.defaultIntents.length === 0) {
      errors.push('Template must have at least one default intent');
    }

    // Validate that first node is a voicenote (greeting)
    if (this.nodes.length > 0 && this.nodes[0].type !== 'voicenote') {
      errors.push('First node should be a voicenote (greeting)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

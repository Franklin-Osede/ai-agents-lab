import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workflow_templates')
export class WorkflowTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  niche: string; // e.g., 'dental', 'lawyer'

  @Column()
  name: string; // e.g., 'Plantilla Dental Completa'

  @Column('jsonb')
  structure: Record<string, unknown>; // The node structure

  @Column({ default: false })
  is_public: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

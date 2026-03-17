import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type WorkflowStatus = 'draft' | 'published' | 'archived';

@Entity('workflow_versions')
export class WorkflowVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workflowId: string;

  @Column('int')
  versionNumber: number;

  @Column('jsonb')
  nodes: any[];

  @Column('jsonb', { nullable: true })
  settings: any;

  @Column({ default: 'draft' })
  status: WorkflowStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

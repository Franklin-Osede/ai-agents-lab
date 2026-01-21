import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SessionStatus = 'active' | 'completed' | 'paused';

@Entity('workflow_sessions')
export class WorkflowSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workflowId: string;

  @Column('uuid')
  versionId: string; // The specific snapshot being used

  @Column('uuid', { nullable: true })
  knowledgeSourceId: string; // Link to the specific scraped knowledge used for this session

  @Column()
  currentNodeId: string; // Pointer to the current node in the graph

  @Column('jsonb', { default: {} })
  variables: Record<string, any>; // Collected data (e.g. { user_name: 'Juan' })

  @Column('jsonb', { default: [] })
  history: Record<string, any>[]; // Log of steps taken

  @Column({ default: 'active' })
  status: SessionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

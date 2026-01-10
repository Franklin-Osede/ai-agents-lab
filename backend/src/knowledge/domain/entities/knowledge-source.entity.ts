import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum KnowledgeStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ERROR = 'error',
}

@Entity('knowledge_sources')
export class KnowledgeSource {
  @PrimaryColumn()
  id: string;

  @Column()
  tenantId: string;

  @Column()
  url: string;

  @Column({ type: 'enum', enum: KnowledgeStatus, default: KnowledgeStatus.PENDING })
  status: KnowledgeStatus;

  @Column()
  scrapedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  constructor(partial: Partial<KnowledgeSource>) {
    Object.assign(this, partial);
    if (!this.scrapedAt) {
      this.scrapedAt = new Date();
    }
    if (!this.status) {
      this.status = KnowledgeStatus.PENDING;
    }
  }
}

export enum KnowledgeStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ERROR = 'error',
}

export class KnowledgeSource {
  id: string;
  tenantId: string;
  url: string;
  status: KnowledgeStatus;
  scrapedAt: Date;
  metadata: Record<string, unknown>;

  constructor(partial: Partial<KnowledgeSource>) {
    Object.assign(this, partial);
    this.scrapedAt = new Date();
    this.status = this.status || KnowledgeStatus.PENDING;
  }
}

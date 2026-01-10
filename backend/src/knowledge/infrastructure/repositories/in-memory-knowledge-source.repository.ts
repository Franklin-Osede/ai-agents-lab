import { Injectable } from '@nestjs/common';
import { IKnowledgeSourceRepository } from '../../domain/repositories/knowledge-source.repository';
import { KnowledgeSource } from '../../domain/entities/knowledge-source.entity';

@Injectable()
export class InMemoryKnowledgeSourceRepository implements IKnowledgeSourceRepository {
  private sources: Map<string, KnowledgeSource> = new Map();

  async save(source: KnowledgeSource): Promise<KnowledgeSource> {
    this.sources.set(source.id, source);
    return source;
  }

  async findById(id: string): Promise<KnowledgeSource | null> {
    return this.sources.get(id) || null;
  }

  async findByTenantId(tenantId: string): Promise<KnowledgeSource[]> {
    return Array.from(this.sources.values()).filter((s) => s.tenantId === tenantId);
  }

  async findLatestByTenantId(tenantId: string): Promise<KnowledgeSource | null> {
    const tenantSources = await this.findByTenantId(tenantId);
    if (tenantSources.length === 0) return null;
    // Sort by scrapedAt desc
    return tenantSources.sort((a, b) => b.scrapedAt.getTime() - a.scrapedAt.getTime())[0];
  }
}

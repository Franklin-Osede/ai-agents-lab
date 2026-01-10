import { KnowledgeSource } from '../entities/knowledge-source.entity';

export abstract class IKnowledgeSourceRepository {
  abstract save(source: KnowledgeSource): Promise<KnowledgeSource>;
  abstract findById(id: string): Promise<KnowledgeSource | null>;
  abstract findByTenantId(tenantId: string): Promise<KnowledgeSource[]>;
  abstract findLatestByTenantId(tenantId: string): Promise<KnowledgeSource | null>;
}

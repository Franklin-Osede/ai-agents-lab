import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IKnowledgeSourceRepository } from '../../domain/repositories/knowledge-source.repository';
import { KnowledgeSource } from '../../domain/entities/knowledge-source.entity';

@Injectable()
export class TypeOrmKnowledgeSourceRepository implements IKnowledgeSourceRepository {
  constructor(
    @InjectRepository(KnowledgeSource)
    private readonly typeOrmRepo: Repository<KnowledgeSource>,
  ) {}

  async save(source: KnowledgeSource): Promise<KnowledgeSource> {
    return this.typeOrmRepo.save(source);
  }

  async findById(id: string): Promise<KnowledgeSource | null> {
    return this.typeOrmRepo.findOne({ where: { id } });
  }

  async findByTenantId(tenantId: string): Promise<KnowledgeSource[]> {
    return this.typeOrmRepo.find({ where: { tenantId } });
  }

  async findLatestByTenantId(tenantId: string): Promise<KnowledgeSource | null> {
    return this.typeOrmRepo.findOne({
      where: { tenantId },
      order: { scrapedAt: 'DESC' },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { IKnowledgeSourceRepository } from '../../domain/repositories/knowledge-source.repository';

@Injectable()
export class GetOrganizationInfoUseCase {
  constructor(private readonly repository: IKnowledgeSourceRepository) {}

  async execute(tenantId: string) {
    const latestSource = await this.repository.findLatestByTenantId(tenantId);
    if (!latestSource || !latestSource.metadata) {
      return {
        services: [],
        team: [],
        businessInfo: {},
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = latestSource.metadata as any;

    return {
      services: m.structuredData?.services || [],
      team: m.team || [],
      businessInfo: m.structuredData?.businessInfo || {},
    };
  }
}

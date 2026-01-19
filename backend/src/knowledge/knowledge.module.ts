import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { IngestWebsiteUseCase } from './application/use-cases/ingest-website.use-case';
import { IScraperService } from './domain/repositories/scraping.service';
import { ContentClassifierService } from './domain/services/content-classifier.service';
import { PuppeteerScraperAdapter } from './infrastructure/scraping/puppeteer-scraper.adapter';
import { KnowledgeController } from './presentation/knowledge.controller';

import { ConfigModule } from '@nestjs/config';
import { BedrockContentAnalysisService } from './infrastructure/ai/bedrock-content-analysis.service';
import { KnowledgeEventsGateway } from './presentation/knowledge-events.gateway';
import { IKnowledgeSourceRepository } from './domain/repositories/knowledge-source.repository';
// import { InMemoryKnowledgeSourceRepository } from './infrastructure/repositories/in-memory-knowledge-source.repository';
import { TypeOrmKnowledgeSourceRepository } from './infrastructure/repositories/typeorm-knowledge-source.repository';
import { GetOrganizationInfoUseCase } from './application/use-cases/get-organization-info.use-case';
import { KnowledgeSource } from './domain/entities/knowledge-source.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([KnowledgeSource]), // Register Entity
  ],
  providers: [
    ContentClassifierService,
    BedrockContentAnalysisService,
    IngestWebsiteUseCase,
    GetOrganizationInfoUseCase,
    KnowledgeEventsGateway,
    {
      provide: IScraperService,
      useClass: PuppeteerScraperAdapter,
    },
    {
      provide: IKnowledgeSourceRepository,
      useClass: TypeOrmKnowledgeSourceRepository, // Use TypeORM Repo
    },
  ],
  controllers: [KnowledgeController],
  exports: [IngestWebsiteUseCase, GetOrganizationInfoUseCase, IKnowledgeSourceRepository],
})
export class KnowledgeModule {}

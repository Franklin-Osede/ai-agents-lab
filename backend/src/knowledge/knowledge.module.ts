import { Module } from '@nestjs/common';
import { IngestWebsiteUseCase } from './application/use-cases/ingest-website.use-case';
import { IScraperService } from './domain/repositories/scraping.service';
import { ContentClassifierService } from './domain/services/content-classifier.service';
import { PuppeteerScraperAdapter } from './infrastructure/scraping/puppeteer-scraper.adapter';
import { KnowledgeController } from './presentation/knowledge.controller';

import { ConfigModule } from '@nestjs/config';
import { BedrockContentAnalysisService } from './infrastructure/ai/bedrock-content-analysis.service';
import { KnowledgeEventsGateway } from './presentation/knowledge-events.gateway';

@Module({
  imports: [ConfigModule],
  providers: [
    ContentClassifierService,
    BedrockContentAnalysisService,
    IngestWebsiteUseCase,
    KnowledgeEventsGateway,
    {
      provide: IScraperService,
      useClass: PuppeteerScraperAdapter,
    },
  ],
  controllers: [KnowledgeController],
  exports: [IngestWebsiteUseCase],
})
export class KnowledgeModule {}

import { Module } from '@nestjs/common';
import { IngestWebsiteUseCase } from './application/use-cases/ingest-website.use-case';
import { IScraperService } from './domain/repositories/scraping.service';
import { ContentClassifierService } from './domain/services/content-classifier.service';
import { PuppeteerScraperAdapter } from './infrastructure/scraping/puppeteer-scraper.adapter';
import { KnowledgeController } from './presentation/knowledge.controller';

import { KnowledgeEventsGateway } from './presentation/knowledge-events.gateway';

@Module({
  providers: [
    ContentClassifierService,
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

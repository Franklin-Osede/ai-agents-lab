import { Injectable } from '@nestjs/common';
import { IScraperService } from '../../domain/repositories/scraping.service';
import { ContentClassifierService } from '../../domain/services/content-classifier.service';
import { KnowledgeSource, KnowledgeStatus } from '../../domain/entities/knowledge-source.entity';

@Injectable()
export class IngestWebsiteUseCase {
  constructor(
    private readonly scraper: IScraperService,
    private readonly classifier: ContentClassifierService,
  ) {}

  async execute(
    url: string,
    tenantId: string,
  ): Promise<{ sourceId: string; status: string; metadata: unknown }> {
    try {
      // 1. Scrape the URL
      const scrapedData = await this.scraper.scrapeUrl(url);

      // 2. Classify the content
      const classification = await this.classifier.classify(scrapedData.content);

      // 3. Create Entity
      const sourceId = `src-${Date.now()}`;
      const source = new KnowledgeSource({
        id: sourceId,
        url: url,
        tenantId: tenantId,
        status: KnowledgeStatus.PROCESSING,
        metadata: {
          title: scrapedData.title,
          classification: classification,
          summary: scrapedData.content.substring(0, 500) + '...',
        },
      });

      return {
        sourceId: source.id,
        status: source.status,
        metadata: source.metadata,
      };
    } catch (error) {
      // Graceful error handling - return status ERROR instead of 500 crash
      console.error('Ingest failed:', error);
      return {
        sourceId: 'error',
        status: KnowledgeStatus.ERROR,
        metadata: { error: (error as Error).message },
      };
    }
  }
}

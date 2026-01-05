import { Injectable } from '@nestjs/common';
import { IScraperService } from '../../domain/repositories/scraping.service';
import { BedrockContentAnalysisService } from '../../infrastructure/ai/bedrock-content-analysis.service';
import { KnowledgeSource, KnowledgeStatus } from '../../domain/entities/knowledge-source.entity';

@Injectable()
export class IngestWebsiteUseCase {
  constructor(
    private readonly scraper: IScraperService,
    private readonly bedrockAnalyzer: BedrockContentAnalysisService,
  ) {}

  async execute(
    url: string,
    tenantId: string,
  ): Promise<{ sourceId: string; status: string; metadata: unknown }> {
    try {
      // 1. Scrape the URL
      const scrapedData = await this.scraper.scrapeUrl(url);

      // 2. Analyze with AI (AWS Bedrock)
      const aiAnalysis = await this.bedrockAnalyzer.analyzeContent(scrapedData.content);

      // 3. Create Entity
      const sourceId = `src-${Date.now()}`;

      // Merge branding: Real styles > AI inference
      const finalBranding = {
        ...aiAnalysis.branding,
        primaryColor: scrapedData.styles?.primaryColor || aiAnalysis.branding.primaryColor,
        logoUrl: scrapedData.logoUrl || aiAnalysis.branding.logoUrl,
      };

      const source = new KnowledgeSource({
        id: sourceId,
        url: url,
        tenantId: tenantId,
        status: KnowledgeStatus.PROCESSING,
        metadata: {
          title: scrapedData.title,
          classification: aiAnalysis.classification,
          summary: aiAnalysis.summary,
          branding: finalBranding,
          screenshot: scrapedData.screenshot, // Base64 Hero Image
          structuredData: aiAnalysis.structuredData,
          dynamicSections: aiAnalysis.dynamicSections,
          rawContentPreview: scrapedData.content.substring(0, 5000),
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

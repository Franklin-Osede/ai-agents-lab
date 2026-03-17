import { Injectable, Logger } from '@nestjs/common';
import { IScraperService } from '../../domain/repositories/scraping.service';
import { BedrockContentAnalysisService } from '../../infrastructure/ai/bedrock-content-analysis.service';
import { KnowledgeStatus, KnowledgeSource } from '../../domain/entities/knowledge-source.entity';
import { KnowledgeEventsGateway } from '../../presentation/knowledge-events.gateway';
import { IKnowledgeSourceRepository } from '../../domain/repositories/knowledge-source.repository';

@Injectable()
export class IngestWebsiteUseCase {
  private readonly logger = new Logger(IngestWebsiteUseCase.name);

  constructor(
    private readonly scraper: IScraperService,
    private readonly bedrockAnalyzer: BedrockContentAnalysisService,
    private readonly eventsGateway: KnowledgeEventsGateway,
    private readonly repository: IKnowledgeSourceRepository,
  ) {}

  async execute(
    url: string,
    tenantId: string,
  ): Promise<{ sourceId: string; status: string; metadata: unknown }> {
    try {
      // 1. Scrape the URL (Now includes GPT-4o analysis internally)
      this.eventsGateway.emitProgress(tenantId, {
        sourceId: 'temp',
        progress: 20,
        stage: 'scraping_main',
        message: 'Conectando con el sitio web...',
      });
      const scrapedData = await this.scraper.scrapeUrl(url);

      // Send screenshot immediately after scraping
      this.eventsGateway.emitProgress(tenantId, {
        sourceId: 'temp',
        progress: 50,
        stage: 'scraping_subpages',
        message: 'Analizando estructura...',
        metadata: {
          screenshot: scrapedData.screenshot,
        },
      });

      // 2. Prepare Metadata (Rely on Scraper's internal AI)
      this.eventsGateway.emitProgress(tenantId, {
        sourceId: 'temp',
        progress: 80,
        stage: 'analyzing',
        message: 'Procesando datos extraídos...',
      });

      // Construct "structuredData" from the rich scrapedData
      // This bridges the gap between the Scraper's format and the Frontend's expected format
      const structuredDataV2 = {
        businessInfo: {
          phone: scrapedData.branding?.phone ?? '',
          email: scrapedData.branding?.email ?? '',
          address: scrapedData.branding?.address ?? '',
          hours: scrapedData.branding?.hours ?? '',
        },
        services: (scrapedData.branding?.services || []).map((s) => ({
          name: s,
          price: 'Consultar',
        })), // Default price
        team: scrapedData.team,
        // Add more fields if frontend expects them
      };

      // OPTIONAL: Try Bedrock only if enabled/working, but DONT fail the process
      try {
        // We skip Bedrock for now to prevent crashes as per logs
        // await this.bedrockAnalyzer.analyzeContent(scrapedData.content);
      } catch (e) {
        this.logger.warn('Bedrock analysis skipped/failed (using GPT-4o data instead)');
      }

      // 3. Create result with metadata
      const sourceId = `src-${Date.now()}`;
      const metadata = {
        title: scrapedData.title,
        summary: scrapedData.content.substring(0, 500), // refined later
        classification: 'General', // could infer from services
        screenshot: scrapedData.screenshot,
        branding: scrapedData.branding || {},
        team: scrapedData.team || [],
        blogPosts: scrapedData.blogPosts || [],
        faqs: scrapedData.faqs || [],
        structuredData: structuredDataV2, // Use OUR generated structured data
      };

      const knowledgeSource = new KnowledgeSource({
        id: sourceId,
        tenantId,
        url,
        status: KnowledgeStatus.COMPLETED,
        scrapedAt: new Date(),
        metadata,
      });

      // 4. Save to Repository
      await this.repository.save(knowledgeSource);

      this.eventsGateway.emitProgress(tenantId, {
        sourceId,
        progress: 100,
        stage: 'completed',
        message: 'Entrenamiento finalizado',
        metadata,
      });

      return {
        sourceId: knowledgeSource.id,
        status: knowledgeSource.status,
        metadata: knowledgeSource.metadata,
      };
    } catch (error) {
      this.logger.error('Ingest failed:', error);
      return {
        sourceId: 'error',
        status: KnowledgeStatus.ERROR,
        metadata: { error: (error as Error).message },
      };
    }
  }

  /**
   * Fallback extraction when AI is unavailable
   * Extracts basic structured data using regex patterns
   */
  private extractBasicData(scrapedData: { content: string; title: string }): {
    summary: string;
    classification: string;
    structuredData: {
      businessInfo: { phone: string | null; email: string | null };
      services: Array<{ name: string; price: string }>;
    };
  } {
    const content = scrapedData.content || '';

    // Extract phone numbers (Spanish format)
    const phoneRegex = /(\+34|0034)?\s?(\d{3}[\s-]?\d{2,3}[\s-]?\d{2,3})/g;
    const phones = content.match(phoneRegex) || [];

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
    const emails = content.match(emailRegex) || [];

    // Extract services (keywords)
    const serviceKeywords = [
      'fisioterapia',
      'osteopatía',
      'rehabilitación',
      'masaje',
      'pilates',
      'yoga',
      'entrenamiento',
      'nutrición',
    ];

    const services: Array<{ name: string; price: string }> = [];
    serviceKeywords.forEach((keyword) => {
      if (content.toLowerCase().includes(keyword)) {
        services.push({
          name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          price: 'Consultar',
        });
      }
    });

    return {
      summary: content.substring(0, 500),
      classification: 'Salud y Bienestar',
      structuredData: {
        businessInfo: {
          phone: phones[0] || null,
          email: emails[0] || null,
        },
        services: services.slice(0, 5), // Max 5 services
      },
    };
  }
}

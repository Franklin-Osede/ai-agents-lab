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
      // 1. Scrape the URL
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
          screenshot: scrapedData.screenshot, // Send screenshot early!
        },
      });
      // 2. Analyze with AI (AWS Bedrock) - WITH FALLBACK
      this.eventsGateway.emitProgress(tenantId, {
        sourceId: 'temp',
        progress: 80,
        stage: 'analyzing',
        message: 'Analizando con IA...',
      });

      let aiAnalysis;
      try {
        aiAnalysis = await this.bedrockAnalyzer.analyzeContent(scrapedData.content);

        // Check if AI returned empty data
        const hasServices = aiAnalysis.structuredData?.services?.length > 0;
        const hasBusinessInfo =
          aiAnalysis.structuredData?.businessInfo &&
          Object.keys(aiAnalysis.structuredData.businessInfo).length > 0;

        if (!hasServices && !hasBusinessInfo) {
          this.logger.warn('AI returned empty structuredData, using fallback extraction');
          aiAnalysis = this.extractBasicData(scrapedData);
        }
      } catch (aiError) {
        this.logger.warn('AI Analysis failed, using fallback extraction', aiError);
        // FALLBACK: Extract basic data without AI
        aiAnalysis = this.extractBasicData(scrapedData);
      }

      // 3. Create result with metadata
      const sourceId = `src-${Date.now()}`;
      const metadata = {
        title: scrapedData.title,
        summary: aiAnalysis.summary || scrapedData.content.substring(0, 500),
        classification: aiAnalysis.classification || 'General',
        screenshot: scrapedData.screenshot,
        branding: scrapedData.branding || {}, // Phase 1: Complete branding data
        team: scrapedData.team || [], // Phase 3: Team extraction
        blogPosts: scrapedData.blogPosts || [],
        faqs: scrapedData.faqs || [],
        structuredData: aiAnalysis.structuredData || null,
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
        metadata, // CRITICAL: Include metadata in final event
      });

      return {
        sourceId: knowledgeSource.id,
        status: knowledgeSource.status,
        metadata: knowledgeSource.metadata,
      };
    } catch (error) {
      // Graceful error handling - return status ERROR instead of 500 crash
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

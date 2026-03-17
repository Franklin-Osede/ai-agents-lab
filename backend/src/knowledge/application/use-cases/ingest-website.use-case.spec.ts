import { Test, TestingModule } from '@nestjs/testing';
import { IngestWebsiteUseCase } from './ingest-website.use-case';
import { IScraperService } from '../../domain/repositories/scraping.service';
import { BedrockContentAnalysisService } from '../../infrastructure/ai/bedrock-content-analysis.service';
import { KnowledgeEventsGateway } from '../../presentation/knowledge-events.gateway';

// Mock Interfaces
const mockScraperService = {
  scrapeUrl: jest.fn(),
};

const mockBedrockService = {
  analyzeContent: jest.fn(),
};

const mockEventsGateway = {
  emitProgress: jest.fn(),
};

describe('IngestWebsiteUseCase', () => {
  let useCase: IngestWebsiteUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestWebsiteUseCase,
        {
          provide: IScraperService,
          useValue: mockScraperService,
        },
        {
          provide: BedrockContentAnalysisService,
          useValue: mockBedrockService,
        },
        {
          provide: KnowledgeEventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    useCase = module.get<IngestWebsiteUseCase>(IngestWebsiteUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should scrape a URL and return a KnowledgeSource ID', async () => {
    // Arrange
    const url = 'https://example-clinic.com';
    const tenantId = 'tenant-1';

    mockScraperService.scrapeUrl.mockResolvedValue({
      url,
      title: 'Example Clinic',
      content: 'Tratamientos de fisioterapia a 50 euros.',
      screenshot: 'base64image',
      styles: { primaryColor: '#000' },
      logoUrl: 'logo.png',
    });

    mockBedrockService.analyzeContent.mockResolvedValue({
      classification: 'service',
      summary: 'A clinic',
      branding: { primaryColor: '#000', logoUrl: 'logo.png' },
      structuredData: {},
      dynamicSections: [],
    });

    // Act
    const result = await useCase.execute(url, tenantId);

    // Assert
    expect(result).toBeDefined();
    expect(result.sourceId).toBeDefined();
    expect(result.status).toBe('processing');

    expect(mockScraperService.scrapeUrl).toHaveBeenCalledWith(url);
    expect(mockBedrockService.analyzeContent).toHaveBeenCalled();
    expect(mockEventsGateway.emitProgress).toHaveBeenCalledTimes(4); // 20, 50, 80, 100
  });
});

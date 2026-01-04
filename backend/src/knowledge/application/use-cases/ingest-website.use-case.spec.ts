import { Test, TestingModule } from '@nestjs/testing';
import { IngestWebsiteUseCase } from './ingest-website.use-case';
import { IScraperService } from '../../domain/repositories/scraping.service';
import {
  ContentClassifierService,
  ContentType,
} from '../../domain/services/content-classifier.service';

// Mock Interfaces
const mockScraperService = {
  scrapeUrl: jest.fn(),
};

const mockClassifierService = {
  classify: jest.fn(),
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
          provide: ContentClassifierService,
          useValue: mockClassifierService,
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
    });

    mockClassifierService.classify.mockResolvedValue({
      type: ContentType.PRICING,
      confidence: 0.9,
      tags: ['pricing'],
    });

    // Act
    const result = await useCase.execute(url, tenantId);

    // Assert
    expect(result).toBeDefined();
    expect(result.sourceId).toBeDefined();
    expect(result.status).toBe('processing'); // Initial status

    expect(mockScraperService.scrapeUrl).toHaveBeenCalledWith(url);
    expect(mockClassifierService.classify).toHaveBeenCalled();
  });
});

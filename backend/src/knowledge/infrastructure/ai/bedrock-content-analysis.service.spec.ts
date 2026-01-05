import { Test, TestingModule } from '@nestjs/testing';
import { BedrockContentAnalysisService } from './bedrock-content-analysis.service';
import { ConfigService } from '@nestjs/config';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('BedrockContentAnalysisService', () => {
  let service: BedrockContentAnalysisService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'AWS_REGION') return 'us-east-1';
      return 'mock-key';
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BedrockContentAnalysisService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BedrockContentAnalysisService>(BedrockContentAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extract dynamic sections and branding from content', async () => {
    // Arrange
    const mockContent = 'Contenido web simulado de una clínica...';
    const mockAiResponse = {
      content: [
        {
          text: JSON.stringify({
            summary: 'Resumen',
            classification: { type: 'Health', confidence: 0.9, tags: [] },
            branding: {
              tone: 'Professional',
              primaryColor: '#0000FF',
            },
            structuredData: {
              services: [],
              team: [],
              businessInfo: {},
            },
            dynamicSections: [
              {
                title: 'Tecnología Avanzada',
                items: [{ headline: 'Láser', description: 'Alta potencia' }],
              },
            ],
          }),
        },
      ],
    };

    // Act
    // Mock the send method
    // Mock the send method
    (service as unknown as { client: { send: jest.Mock } }).client = {
      send: jest.fn().mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify(mockAiResponse)),
      }),
    };

    const result = await service.analyzeContent(mockContent);

    // Assert
    expect(result.branding).toBeDefined();
    expect(result.branding?.primaryColor).toBe('#0000FF');
    expect(result.dynamicSections).toHaveLength(1);
    expect(result.dynamicSections![0].title).toBe('Tecnología Avanzada');
  });
});

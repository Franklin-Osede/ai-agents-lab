import { Test, TestingModule } from '@nestjs/testing';
import { EntityExtractorService } from './entity-extractor.service';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from '../../../../core/domain/agents/interfaces/ai-provider.interface';
import { BookingEntities } from '../../domain/value-objects/booking-entities';
import { AiProviderException } from '../../../../core/shared/exceptions/business.exception';

describe('EntityExtractorService', () => {
  let service: EntityExtractorService;
  let aiProvider: IAiProvider;

  const mockAiProvider: IAiProvider = {
    generateResponse: jest.fn(),
    classifyIntent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntityExtractorService,
        {
          provide: AI_PROVIDER_TOKEN,
          useValue: mockAiProvider,
        },
      ],
    }).compile();

    service = module.get<EntityExtractorService>(EntityExtractorService);
    aiProvider = module.get<IAiProvider>(AI_PROVIDER_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractEntities', () => {
    it('should extract dates and times from message', async () => {
      // Arrange
      const message = 'Quiero reservar para mañana a las 2pm';
      const mockResponse = JSON.stringify({
        dates: ['2024-01-15'],
        times: ['14:00'],
        services: [],
      });

      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue(mockResponse);

      // Act
      const result = await service.extractEntities(message);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.dates).toContain('2024-01-15');
      expect(result.value.times).toContain('14:00');
      expect(aiProvider.generateResponse).toHaveBeenCalled();
    });

    it('should extract services from message', async () => {
      // Arrange
      const message = 'Quiero reservar para botox';
      const mockResponse = JSON.stringify({
        dates: [],
        times: [],
        services: ['botox'],
      });

      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue(mockResponse);

      // Act
      const result = await service.extractEntities(message);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.services).toContain('botox');
    });

    it('should extract location and people from message', async () => {
      // Arrange
      const message = 'Reserva para 2 personas en sucursal centro';
      const mockResponse = JSON.stringify({
        dates: [],
        times: [],
        services: [],
        location: 'centro',
        people: 2,
      });

      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue(mockResponse);

      // Act
      const result = await service.extractEntities(message);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.location).toBe('centro');
      expect(result.value.people).toBe(2);
    });

    it('should return empty entities when AI provider fails', async () => {
      // Arrange
      const message = 'test message';
      jest.spyOn(aiProvider, 'generateResponse').mockRejectedValue(new Error('AI Error'));

      // Act
      const result = await service.extractEntities(message);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.hasEntities()).toBe(false);
    });

    it('should handle invalid JSON response gracefully', async () => {
      // Arrange
      const message = 'test message';
      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue('invalid json');

      // Act
      const result = await service.extractEntities(message);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.hasEntities()).toBe(false);
    });

    it('should handle malformed JSON response', async () => {
      // Arrange
      const message = 'test message';
      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue('{invalid json}');

      // Act
      const result = await service.extractEntities(message);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.hasEntities()).toBe(false);
    });

    it('should use correct AI provider parameters', async () => {
      // Arrange
      const message = 'test message';
      const mockResponse = JSON.stringify({ dates: [], times: [], services: [] });
      jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue(mockResponse);

      // Act
      await service.extractEntities(message);

      // Assert
      expect(aiProvider.generateResponse).toHaveBeenCalledWith(
        expect.stringContaining(message),
        expect.objectContaining({
          temperature: 0.3,
          maxTokens: 200,
        }),
      );
    });
  });
});


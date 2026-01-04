import { Test, TestingModule } from '@nestjs/testing';
import { ContentClassifierService, ContentType } from './content-classifier.service';

describe('ContentClassifierService', () => {
  let service: ContentClassifierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentClassifierService],
    }).compile();

    service = module.get<ContentClassifierService>(ContentClassifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should classify "Precio: 50 euros" as PRICING', async () => {
    const text = 'Consulta General: El precio es de 50 euros por sesión.';
    const result = await service.classify(text);
    
    expect(result.type).toBe(ContentType.PRICING);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should classify "Tratamiento de Fisioterapia Deportiva" as SERVICE', async () => {
    const text = 'Ofrecemos Fisioterapia Deportiva avanzada para atletas.';
    const result = await service.classify(text);
    
    expect(result.type).toBe(ContentType.SERVICE);
  });

  it('should return UNKNOWN for irrelevant text', async () => {
    const text = 'Lorem ipsum dolor sit amet.';
    const result = await service.classify(text);
    
    expect(result.type).toBe(ContentType.UNKNOWN);
  });
});

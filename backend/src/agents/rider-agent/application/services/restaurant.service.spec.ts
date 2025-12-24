import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantService } from './restaurant.service';

describe('RestaurantService', () => {
  let service: RestaurantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RestaurantService],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchRestaurants (TDD Mappings)', () => {
    it('should find Italian restaurants when searching for "italian"', () => {
      const results = service.searchRestaurants('italian');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].cuisine).toContain('Italian');
    });

    it('should find Burger House when searching for "hamburguesa" (Spanish mapping)', () => {
      const results = service.searchRestaurants('hamburguesa');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.name === 'Burger House')).toBe(true);
    });

    it('should find Asian restaurants when searching for "asiática" (Localized)', () => {
      const results = service.searchRestaurants('asiática');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.name === 'Thai Spice')).toBe(true);
    });

    it('should find Sushi Master when searching for "japonés"', () => {
      const results = service.searchRestaurants('japonés');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.name === 'Sushi Master')).toBe(true);
    });

    it('should find Green Garden when searching for "vegano" or "vegetariano"', () => {
      const veganResults = service.searchRestaurants('vegano');
      const vegResults = service.searchRestaurants('vegetariano');

      expect(veganResults.length).toBeGreaterThan(0);
      expect(veganResults[0].name).toBe('Green Garden');

      expect(vegResults.length).toBeGreaterThan(0);
      expect(vegResults[0].name).toBe('Green Garden');
    });

    it('should return all restaurants when query is empty', () => {
      const results = service.searchRestaurants('');
      expect(results.length).toBe(6); // Expecting total mocked restaurants
    });

    it('should return valid results even with partial matches like "burg"', () => {
      const results = service.searchRestaurants('burg');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Burger');
    });
  });
});

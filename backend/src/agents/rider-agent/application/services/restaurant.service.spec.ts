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

  describe('searchRestaurants', () => {
    it('should return all restaurants when query is empty', () => {
      const results = service.searchRestaurants('');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter restaurants by cuisine (case insensitive)', () => {
      const results = service.searchRestaurants('italian');
      expect(results.length).toBeGreaterThan(0);
      results.forEach((r) => {
        expect(r.cuisine.toLowerCase()).toContain('italian');
      });
    });

    it('should filter restaurants by name (case insensitive)', () => {
      const results = service.searchRestaurants('sushi');
      expect(results.length).toBeGreaterThan(0);
      results.forEach((r) => {
        expect(
          r.name.toLowerCase().includes('sushi') || r.cuisine.toLowerCase().includes('sushi'),
        ).toBeTruthy();
      });
    });

    it('should return empty array if no matches found', () => {
      const results = service.searchRestaurants('xyz_non_existent_cuisine');
      expect(results).toEqual([]);
    });
  });
});

import { BookingEntities } from './booking-entities';

describe('BookingEntities Value Object', () => {
  describe('create', () => {
    it('should create valid booking entities with all fields', () => {
      // Arrange & Act
      const entities = BookingEntities.create({
        dates: ['2024-01-15', '2024-01-16'],
        times: ['14:00', '15:00'],
        services: ['botox', 'facial'],
        location: 'centro',
        people: 2,
      });

      // Assert
      expect(entities.isSuccess).toBe(true);
      expect(entities.value.dates).toEqual(['2024-01-15', '2024-01-16']);
      expect(entities.value.times).toEqual(['14:00', '15:00']);
      expect(entities.value.services).toEqual(['botox', 'facial']);
      expect(entities.value.location).toBe('centro');
      expect(entities.value.people).toBe(2);
    });

    it('should create valid booking entities with partial data', () => {
      // Arrange & Act
      const entities = BookingEntities.create({
        dates: ['2024-01-15'],
        times: ['14:00'],
      });

      // Assert
      expect(entities.isSuccess).toBe(true);
      expect(entities.value.dates).toEqual(['2024-01-15']);
      expect(entities.value.times).toEqual(['14:00']);
      expect(entities.value.services).toEqual([]);
      expect(entities.value.location).toBeUndefined();
      expect(entities.value.people).toBeUndefined();
    });

    it('should create valid booking entities with empty data', () => {
      // Arrange & Act
      const entities = BookingEntities.create({});

      // Assert
      expect(entities.isSuccess).toBe(true);
      expect(entities.value.dates).toEqual([]);
      expect(entities.value.times).toEqual([]);
      expect(entities.value.services).toEqual([]);
    });

    it('should handle undefined values gracefully', () => {
      // Arrange & Act
      const entities = BookingEntities.create({
        dates: undefined,
        times: undefined,
        services: undefined,
      });

      // Assert
      expect(entities.isSuccess).toBe(true);
      expect(entities.value.dates).toEqual([]);
      expect(entities.value.times).toEqual([]);
      expect(entities.value.services).toEqual([]);
    });
  });

  describe('hasEntities', () => {
    it('should return true when entities exist', () => {
      // Arrange
      const entities = BookingEntities.create({
        dates: ['2024-01-15'],
        times: ['14:00'],
      }).value;

      // Act & Assert
      expect(entities.hasEntities()).toBe(true);
    });

    it('should return false when no entities exist', () => {
      // Arrange
      const entities = BookingEntities.create({}).value;

      // Act & Assert
      expect(entities.hasEntities()).toBe(false);
    });

    it('should return true when only services exist', () => {
      // Arrange
      const entities = BookingEntities.create({
        services: ['botox'],
      }).value;

      // Act & Assert
      expect(entities.hasEntities()).toBe(true);
    });
  });

  describe('toPlainObject', () => {
    it('should convert to plain object', () => {
      // Arrange
      const entities = BookingEntities.create({
        dates: ['2024-01-15'],
        times: ['14:00'],
        services: ['botox'],
        location: 'centro',
        people: 2,
      }).value;

      // Act
      const plain = entities.toPlainObject();

      // Assert
      expect(plain).toEqual({
        dates: ['2024-01-15'],
        times: ['14:00'],
        services: ['botox'],
        location: 'centro',
        people: 2,
      });
    });
  });
});

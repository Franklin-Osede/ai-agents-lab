import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntityExtractionComponent } from './entity-extraction.component';
import { BookingEntities } from '../../models/agent.model';

describe('EntityExtractionComponent', () => {
  let component: EntityExtractionComponent;
  let fixture: ComponentFixture<EntityExtractionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntityExtractionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityExtractionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('hasEntities', () => {
    it('should return true when entities exist', () => {
      // Arrange
      component.entities = {
        dates: ['2024-01-15'],
        times: ['14:00'],
        services: [],
      };

      // Act & Assert
      expect(component.hasEntities()).toBe(true);
    });

    it('should return false when no entities exist', () => {
      // Arrange
      component.entities = undefined;

      // Act & Assert
      expect(component.hasEntities()).toBe(false);
    });

    it('should return false when entities are empty', () => {
      // Arrange
      component.entities = {
        dates: [],
        times: [],
        services: [],
      };

      // Act & Assert
      expect(component.hasEntities()).toBe(false);
    });

    it('should return true when only services exist', () => {
      // Arrange
      component.entities = {
        dates: [],
        times: [],
        services: ['botox'],
      };

      // Act & Assert
      expect(component.hasEntities()).toBe(true);
    });

    it('should return true when location exists', () => {
      // Arrange
      component.entities = {
        dates: [],
        times: [],
        services: [],
        location: 'centro',
      };

      // Act & Assert
      expect(component.hasEntities()).toBe(true);
    });

    it('should return true when people exists', () => {
      // Arrange
      component.entities = {
        dates: [],
        times: [],
        services: [],
        people: 2,
      };

      // Act & Assert
      expect(component.hasEntities()).toBe(true);
    });
  });

  describe('display', () => {
    it('should display dates when they exist', () => {
      // Arrange
      component.entities = {
        dates: ['2024-01-15', '2024-01-16'],
        times: [],
        services: [],
      };
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const dateBadges = compiled.querySelectorAll('.date-badge');

      // Assert
      expect(dateBadges.length).toBeGreaterThan(0);
    });

    it('should display times when they exist', () => {
      // Arrange
      component.entities = {
        dates: [],
        times: ['14:00', '15:00'],
        services: [],
      };
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const timeBadges = compiled.querySelectorAll('.time-badge');

      // Assert
      expect(timeBadges.length).toBeGreaterThan(0);
    });

    it('should display services when they exist', () => {
      // Arrange
      component.entities = {
        dates: [],
        times: [],
        services: ['botox', 'facial'],
      };
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const serviceBadges = compiled.querySelectorAll('.service-badge');

      // Assert
      expect(serviceBadges.length).toBeGreaterThan(0);
    });

    it('should not display component when no entities', () => {
      // Arrange
      component.entities = undefined;
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const container = compiled.querySelector('.entity-extraction');

      // Assert
      expect(container).toBeFalsy();
    });
  });
});

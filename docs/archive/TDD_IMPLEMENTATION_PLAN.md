# 🧪 TDD Implementation Plan - Booking Agent (DDD + Clean Code)

## 📐 Arquitectura y Principios

### Domain-Driven Design (DDD)
- **Domain Layer**: Entidades y Value Objects puros
- **Application Layer**: Use Cases y Services (lógica de negocio)
- **Infrastructure Layer**: Implementaciones técnicas (AI, DB)
- **Presentation Layer**: Controllers y DTOs

### Test-Driven Development (TDD)
1. 🔴 **RED**: Escribir test que falle
2. 🟢 **GREEN**: Implementar mínimo código para pasar
3. 🔵 **REFACTOR**: Mejorar código manteniendo tests verdes

### Clean Code Principles
- **SOLID**: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **Naming**: Nombres descriptivos y claros
- **Small Functions**: Funciones pequeñas y enfocadas
- **Comments**: Solo cuando el código no es auto-explicativo

---

## 🎯 FASE 1: Extracción de Entidades (Backend + Frontend)

### 1.1 Backend - Domain Layer (TDD)

#### Step 1: Crear Value Object para Entidades Extraídas

**Test primero** (`booking-entities.spec.ts`):
```typescript
describe('BookingEntities Value Object', () => {
  it('should create valid booking entities', () => {
    // Arrange & Act
    const entities = BookingEntities.create({
      dates: ['2024-01-15'],
      times: ['14:00'],
      services: ['botox'],
      location: 'centro',
      people: 2
    });

    // Assert
    expect(entities.isSuccess).toBe(true);
    expect(entities.value.dates).toEqual(['2024-01-15']);
  });

  it('should validate empty entities', () => {
    // Arrange & Act
    const entities = BookingEntities.create({});

    // Assert
    expect(entities.isSuccess).toBe(true);
    expect(entities.value.dates).toEqual([]);
  });
});
```

**Implementación** (`booking-entities.ts`):
```typescript
export class BookingEntities {
  private constructor(
    public readonly dates: string[],
    public readonly times: string[],
    public readonly services: string[],
    public readonly location?: string,
    public readonly people?: number
  ) {}

  static create(data: Partial<BookingEntities>): Result<BookingEntities> {
    return Result.ok(new BookingEntities(
      data.dates || [],
      data.times || [],
      data.services || [],
      data.location,
      data.people
    ));
  }
}
```

#### Step 2: Crear Entity Extractor Service (TDD)

**Test primero** (`entity-extractor.service.spec.ts`):
```typescript
describe('EntityExtractorService', () => {
  let service: EntityExtractorService;
  let aiProvider: IAiProvider;

  beforeEach(() => {
    // Setup mocks
  });

  it('should extract dates from message', async () => {
    // Arrange
    const message = 'Quiero reservar para mañana a las 2pm';
    const mockResponse = JSON.stringify({
      dates: ['2024-01-15'],
      times: ['14:00'],
      services: []
    });

    jest.spyOn(aiProvider, 'generateResponse').mockResolvedValue(mockResponse);

    // Act
    const result = await service.extractEntities(message);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.value.dates).toContain('2024-01-15');
    expect(result.value.times).toContain('14:00');
  });

  it('should handle extraction errors gracefully', async () => {
    // Arrange
    jest.spyOn(aiProvider, 'generateResponse').mockRejectedValue(new Error('AI Error'));

    // Act
    const result = await service.extractEntities('test');

    // Assert
    expect(result.isFailure).toBe(true);
  });
});
```

**Implementación** (`entity-extractor.service.ts`):
```typescript
@Injectable()
export class EntityExtractorService {
  constructor(@Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: IAiProvider) {}

  async extractEntities(message: string): Promise<Result<BookingEntities>> {
    try {
      const prompt = this.buildExtractionPrompt(message);
      const response = await this.aiProvider.generateResponse(prompt, {
        temperature: 0.3,
        maxTokens: 200
      });
      
      return this.parseEntities(response);
    } catch (error) {
      return Result.fail(new Error('Failed to extract entities'));
    }
  }

  private buildExtractionPrompt(message: string): string {
    return `Extract booking entities from: "${message}"
    Return JSON: {dates: string[], times: string[], services: string[], location?: string, people?: number}`;
  }

  private parseEntities(response: string): Result<BookingEntities> {
    try {
      const parsed = JSON.parse(response);
      return BookingEntities.create(parsed);
    } catch {
      return Result.fail(new Error('Invalid entity format'));
    }
  }
}
```

#### Step 3: Integrar en BookingAgentService (TDD)

**Test primero** (actualizar `booking-agent.service.spec.ts`):
```typescript
it('should include extracted entities in response', async () => {
  // Arrange
  const request = {
    message: 'Quiero reservar mañana a las 2pm para botox',
    businessId: 'business-456'
  };

  const mockEntities = BookingEntities.create({
    dates: ['2024-01-15'],
    times: ['14:00'],
    services: ['botox']
  });

  jest.spyOn(entityExtractor, 'extractEntities').mockResolvedValue(Result.ok(mockEntities.value));

  // Act
  const result = await service.processBookingRequest(request);

  // Assert
  expect(result.value.entities).toBeDefined();
  expect(result.value.entities?.dates).toContain('2024-01-15');
});
```

**Implementación** (actualizar `booking-agent.service.ts`):
```typescript
async processBookingRequest(request: BookingRequest): Promise<Result<BookingResponse>> {
  // ... existing code ...
  
  const entitiesResult = await this.entityExtractor.extractEntities(request.message);
  const entities = entitiesResult.isSuccess ? entitiesResult.value : BookingEntities.create({}).value;

  return Result.ok({
    // ... existing fields ...
    entities: {
      dates: entities.dates,
      times: entities.times,
      services: entities.services,
      location: entities.location,
      people: entities.people
    }
  });
}
```

---

### 1.2 Frontend - Entity Extraction Component (TDD)

#### Step 1: Crear Component Test

**Test primero** (`entity-extraction.component.spec.ts`):
```typescript
describe('EntityExtractionComponent', () => {
  let component: EntityExtractionComponent;
  let fixture: ComponentFixture<EntityExtractionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EntityExtractionComponent]
    });
    fixture = TestBed.createComponent(EntityExtractionComponent);
    component = fixture.componentInstance;
  });

  it('should display extracted dates', () => {
    // Arrange
    component.entities = {
      dates: ['2024-01-15'],
      times: ['14:00'],
      services: ['botox']
    };

    // Act
    fixture.detectChanges();

    // Assert
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.date-badge')).toBeTruthy();
  });

  it('should highlight entities in message', () => {
    // Arrange
    component.message = 'Quiero reservar mañana a las 2pm';
    component.entities = {
      dates: ['2024-01-15'],
      times: ['14:00'],
      services: []
    };

    // Act
    fixture.detectChanges();

    // Assert
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.highlighted')).toBeTruthy();
  });
});
```

**Implementación** (`entity-extraction.component.ts`):
```typescript
@Component({
  selector: 'app-entity-extraction',
  templateUrl: './entity-extraction.component.html',
  styleUrls: ['./entity-extraction.component.scss']
})
export class EntityExtractionComponent {
  @Input() entities?: {
    dates: string[];
    times: string[];
    services: string[];
    location?: string;
    people?: number;
  };
  @Input() message = '';

  hasEntities(): boolean {
    return !!(
      this.entities?.dates?.length ||
      this.entities?.times?.length ||
      this.entities?.services?.length
    );
  }
}
```

---

## 🎯 FASE 2: Flujo de Procesamiento Visual

### 2.1 Frontend - Processing Steps Component (TDD)

**Test primero** (`processing-steps.component.spec.ts`):
```typescript
describe('ProcessingStepsComponent', () => {
  it('should display all processing steps', () => {
    // Arrange
    component.steps = [
      { id: 'receive', label: 'Recibiendo mensaje', completed: true },
      { id: 'analyze', label: 'Analizando intención', completed: false }
    ];

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.steps.length).toBe(2);
  });

  it('should update step progress', () => {
    // Arrange
    component.currentStep = 'analyze';

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.getProgress()).toBeGreaterThan(0);
  });
});
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN (TDD)

### Backend
- [ ] ✅ Crear `BookingEntities` Value Object (Test → Implementación)
- [ ] ✅ Crear `EntityExtractorService` (Test → Implementación)
- [ ] ✅ Integrar en `BookingAgentService` (Test → Implementación)
- [ ] ✅ Actualizar DTOs para incluir entities
- [ ] ✅ Agregar endpoint para disponibilidad de horarios
- [ ] ✅ Agregar endpoint para historial de cliente

### Frontend
- [ ] ✅ Crear `EntityExtractionComponent` (Test → Implementación)
- [ ] ✅ Crear `ProcessingStepsComponent` (Test → Implementación)
- [ ] ✅ Crear `IntentAnalysisComponent` (Test → Implementación)
- [ ] ✅ Crear `CalendarPickerComponent` (Test → Implementación)
- [ ] ✅ Crear `TimeSlotPickerComponent` (Test → Implementación)
- [ ] ✅ Crear `ConflictResolverComponent` (Test → Implementación)
- [ ] ✅ Crear `BookingSummaryComponent` (Test → Implementación)

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

1. **Backend - Entity Extraction** (TDD)
   - Test → Implementación → Refactor
   
2. **Frontend - Entity Extraction Component** (TDD)
   - Test → Implementación → Integración

3. **Frontend - Processing Steps** (TDD)
   - Test → Implementación → Integración

4. Continuar con resto de fases...

---

## ✅ CRITERIOS DE ACEPTACIÓN

Cada funcionalidad debe:
- ✅ Tener tests unitarios (cobertura >80%)
- ✅ Seguir principios SOLID
- ✅ Tener código limpio y legible
- ✅ Estar documentado cuando sea necesario
- ✅ Funcionar con datos simulados si backend no disponible
- ✅ Manejar errores gracefully
- ✅ Ser responsive y accesible


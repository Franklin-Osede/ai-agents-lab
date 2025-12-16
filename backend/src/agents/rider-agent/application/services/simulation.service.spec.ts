import { Test, TestingModule } from '@nestjs/testing';
import { SimulationService } from './simulation.service';
import { Server } from 'socket.io';

describe('SimulationService (TDD)', () => {
  let service: SimulationService;
  let mockServer: Partial<Server>;

  // ARRANGE
  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SimulationService],
    }).compile();

    service = module.get<SimulationService>(SimulationService);
    service.setServer(mockServer as Server);
  });

  afterEach(() => {
    // Cleanup intervals
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start a simulation and emit rider updates', () => {
    // ARRANGE
    jest.useFakeTimers();
    const tenantId = 'tenant-test-123';

    // ACT
    const result = service.startSimulation(tenantId);

    // Fast-forward time to trigger the interval (2 seconds)
    jest.advanceTimersByTime(2000);

    // ASSERT
    expect(result).toBeDefined();
    expect(result.status).toBe('Simulation Started');
    expect(mockServer.emit).toHaveBeenCalledWith(
      'rider_update',
      expect.objectContaining({
        tenantId: tenantId,
        rider: expect.objectContaining({
          name: 'Marco Rossi',
        }),
      }),
    );
  });

  it('should trigger an incident alert at step 2', () => {
    // ARRANGE
    jest.useFakeTimers();
    const tenantId = 'tenant-test-traffic';
    service.startSimulation(tenantId);

    // ACT: Advance time 3 steps (0 -> 1 -> 2)
    // Step 0: 2000ms
    // Step 1: 4000ms
    // Step 2: 6000ms
    jest.advanceTimersByTime(6000);

    // ASSERT
    expect(mockServer.emit).toHaveBeenCalledWith(
      'incident_alert',
      expect.objectContaining({
        type: 'TRAFFIC_DELAY',
        severity: 'medium',
      }),
    );
  });
});

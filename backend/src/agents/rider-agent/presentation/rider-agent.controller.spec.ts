import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RiderAgentController } from './rider-agent.controller';
import { RiderBedrockService } from '../application/services/rider-bedrock.service';
import { RiderLocationService } from '../application/services/rider-location.service';
import { SimulationService } from '../application/services/simulation.service';
import { RiderOrder } from '../domain/entities/rider-order.entity';
import { CreateRideDto } from './dtos/create-ride.dto';

describe('RiderAgentController', () => {
  let controller: RiderAgentController;
  let bedrockService: RiderBedrockService;
  let locationService: RiderLocationService;
  let simulationService: SimulationService;

  const mockRepository = {
    create: jest.fn().mockReturnValue({ id: 'test-order-id', price: 15 }),
    save: jest.fn().mockResolvedValue({ id: 'test-order-id' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiderAgentController],
      providers: [
        {
          provide: RiderBedrockService,
          useValue: {
            extractRideIntent: jest.fn().mockResolvedValue({
              pickup: "Domino's",
              dropoff: 'Central Park',
              intent: 'delivery_request',
            }),
          },
        },
        {
          provide: RiderLocationService,
          useValue: {
            geocode: jest.fn().mockResolvedValue({ lat: 40, lng: -73, address: 'Mock Address' }),
            calculateRoute: jest
              .fn()
              .mockResolvedValue({ distanceKm: 5, durationMin: 10, price: 15 }),
          },
        },
        {
          provide: SimulationService,
          useValue: {
            startSimulation: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RiderOrder),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<RiderAgentController>(RiderAgentController);
    bedrockService = module.get<RiderBedrockService>(RiderBedrockService);
    locationService = module.get<RiderLocationService>(RiderLocationService);
    simulationService = module.get<SimulationService>(SimulationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should handle delivery request, calculate route, save order, and start simulation', async () => {
    const dto: CreateRideDto = {
      text: "Bring me a pizza from Domino's to Central Park",
      userId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = await controller.handleRideRequest(dto);

    expect(bedrockService.extractRideIntent).toHaveBeenCalledWith(dto.text);
    expect(locationService.geocode).toHaveBeenCalledTimes(2);
    expect(locationService.calculateRoute).toHaveBeenCalled();
    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalled();
    expect(simulationService.startSimulation).toHaveBeenCalled();

    expect(result).toEqual({
      status: 'processing',
      ai_interpretation: {
        pickup: "Domino's", // Restaurant inferred
        dropoff: 'Central Park', // Delivery address
        intent: 'delivery_request',
      },
      next_step: 'confirm_price',
      orderId: 'test-order-id',
      price: 15,
    });
  });
});

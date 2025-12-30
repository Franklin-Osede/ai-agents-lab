import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Logger,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiderBedrockService } from '../application/services/rider-bedrock.service';
import { RiderLocationService } from '../application/services/rider-location.service';
import { SimulationService } from '../application/services/simulation.service';
import { RiderOrder, RiderOrderStatus } from '../domain/entities/rider-order.entity';
import { CreateRideDto } from './dtos/create-ride.dto';
import { RiderResponseDto, AiIntent, AiInterpretationDto } from './dtos/rider-response.dto';
import { RestaurantService } from '../application/services/restaurant.service';
import { RiderProfileFactory } from '../application/services/rider-profile.factory';

@Controller('rider')
export class RiderAgentController {
  private readonly logger = new Logger(RiderAgentController.name);

  constructor(
    private readonly bedrockService: RiderBedrockService,
    private readonly locationService: RiderLocationService,
    private readonly simulationService: SimulationService,
    private readonly restaurantService: RestaurantService,
    private readonly riderProfileFactory: RiderProfileFactory,
    @InjectRepository(RiderOrder)
    private readonly riderOrderRepository: Repository<RiderOrder>,
  ) {}

  @Get('profile-preview')
  async getProfilePreview(@Query('name') name: string) {
    if (!name) return {};
    return await this.riderProfileFactory.generateProfile(name);
  }

  @Post('interact')
  @UseInterceptors(FileInterceptor('audio'))
  async interactWithAgent(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      // Handle case where file is missing (e.g. text only interaction or error)
      return { message: 'No audio file provided', intent: AiIntent.UNKNOWN };
    }

    // 1. STT (Mocked for Demo - Real impl would use AWS Transcribe here)
    // We simulate the user saying "I want Italian food" to demonstrate dynamic filtering.
    const mockTranscript = 'I want Italian food';
    this.logger.log(`[Mock STT] Transcribed: "${mockTranscript}"`);

    // 2. Interpret Intent (Bedrock)
    const aiResponse = await this.bedrockService.extractRideIntent(mockTranscript);

    // 3. Logic based on Intent
    // Use an intersection type or partial for the result to satisfy typescript
    const result: AiInterpretationDto = { ...aiResponse };

    if (aiResponse.intent === AiIntent.SEARCH_REQUEST) {
      const restaurants = this.restaurantService.searchRestaurants(aiResponse.search_term || '');
      result.restaurants = restaurants;
      result.message = `Found ${restaurants.length} places for "${aiResponse.search_term || 'food'}"`;
    } else if (aiResponse.intent === AiIntent.RIDE_REQUEST) {
      if (!aiResponse.pickup) {
        // If pickup missing, assume current location (mock)
        aiResponse.pickup = 'Current Location';
      }
    }

    return result;
  }

  @Post('restaurant/:id/menu')
  async getRestaurantMenu(@Body() body: { category?: string }) {
    // TODO: Get ID from param, body for category is fine or query param
    // For now just returning the service call
    return this.restaurantService.getMenu('1', body?.category || '');
  }

  @Post('request')
  async handleRideRequest(@Body() body: CreateRideDto): Promise<RiderResponseDto> {
    this.logger.log(`Received ride request from ${body.userId}: ${body.text}`);

    // 1. Understand Intent (AI)
    const intent = await this.bedrockService.extractRideIntent(body.text);

    let nextStep = 'calculating_route';
    let savedOrder: RiderOrder | null = null;
    let price: number | undefined;

    // 2. Geocode & Calculate (Location Service)
    if (intent.dropoff) {
      const pickupCoords = await this.locationService.geocode(intent.pickup || 'Current Location');
      const dropoffCoords = await this.locationService.geocode(intent.dropoff);

      const route = await this.locationService.calculateRoute(pickupCoords, dropoffCoords);
      this.logger.log(`Route calculated: ${route.distanceKm}km, $${route.price}`);

      price = route.price;
      nextStep = 'confirm_price';

      // 3. Save Order (DB)
      savedOrder = this.riderOrderRepository.create({
        userId: body.userId,
        pickupAddress: pickupCoords.address,
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        dropoffAddress: dropoffCoords.address,
        dropoffLat: dropoffCoords.lat,
        dropoffLng: dropoffCoords.lng,
        price: route.price,
        status: RiderOrderStatus.PENDING,
        estimatedDurationRes: JSON.stringify({ duration: route.durationMin }),
      });

      await this.riderOrderRepository.save(savedOrder);
      this.logger.log(`Order saved with ID: ${savedOrder.id}`);

      // 4. Trigger Simulation (Ghost Driver)
      // This makes the "driver" start moving immediately for the demo
      await this.simulationService.startSimulation(
        body.userId, // Using userId as tenantId/sessionId for simplicity
        { lat: pickupCoords.lat, lng: pickupCoords.lng },
        { lat: dropoffCoords.lat, lng: dropoffCoords.lng },
        body.riderName,
      );
    }

    return {
      status: 'processing',
      ai_interpretation: intent,
      next_step: nextStep,
      orderId: savedOrder?.id,
      price: price,
    };
  }
}

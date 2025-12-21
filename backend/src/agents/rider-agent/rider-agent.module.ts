import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RiderOrder } from './domain/entities/rider-order.entity';
import { RiderBedrockService } from './application/services/rider-bedrock.service';
import { RiderLocationService } from './application/services/rider-location.service';
import { SimulationService } from './application/services/simulation.service';
import { RiderGateway } from './presentation/rider.gateway';
import { RiderAgentController } from './presentation/rider-agent.controller';
import { RestaurantService } from './application/services/restaurant.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([RiderOrder])],
  controllers: [RiderAgentController],
  providers: [
    RiderBedrockService,
    RiderLocationService,
    SimulationService,
    RestaurantService,
    RiderGateway,
  ],
  exports: [RiderBedrockService, RiderLocationService],
})
export class RiderAgentModule {}

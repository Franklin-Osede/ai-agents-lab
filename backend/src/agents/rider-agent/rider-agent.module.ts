import { Module } from '@nestjs/common';
import { SimulationService } from './application/services/simulation.service';
import { RiderGateway } from './presentation/rider.gateway';
import { RiderAgentController } from './presentation/rider-agent.controller';

@Module({
  imports: [],
  controllers: [RiderAgentController],
  providers: [SimulationService, RiderGateway],
  exports: [SimulationService],
})
export class RiderAgentModule {}

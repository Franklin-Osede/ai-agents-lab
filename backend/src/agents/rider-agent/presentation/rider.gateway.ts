import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SimulationService } from '../application/services/simulation.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'rider',
})
export class RiderGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly simulationService: SimulationService) {
    // Inject the server instance into the service so it can broadcast
    this.simulationService.setServer(this.server);
  }

  @SubscribeMessage('start_simulation')
  handleStartSimulation(@MessageBody() data: { tenantId: string }) {
    // In a real app, we would validate the tenantId from the user's token
    console.log(`Starting simulation for tenant: ${data.tenantId}`);
    return this.simulationService.startSimulation(data.tenantId);
  }
}

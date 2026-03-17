import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
// WebSocket Gateway for Knowledge Events

@WebSocketGateway({
  namespace: 'knowledge',
  cors: {
    origin: '*',
  },
})
export class KnowledgeEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(KnowledgeEventsGateway.name);

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant-${tenantId}`);
      this.logger.log(`Client ${client.id} joined room tenant-${tenantId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  emitProgress(tenantId: string, payload: Record<string, unknown>) {
    this.server.to(`tenant-${tenantId}`).emit('knowledge.progress', payload);
  }

  emitContentFound(tenantId: string, payload: Record<string, unknown>) {
    this.server.to(`tenant-${tenantId}`).emit('knowledge.content_found', payload);
  }
}

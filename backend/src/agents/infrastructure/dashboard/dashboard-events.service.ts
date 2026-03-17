import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class DashboardEventsService {
  private clients: Map<string, Response> = new Map();

  addClient(clientId: string, res: Response) {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    this.clients.set(clientId, res);

    const keepAliveParams = '\n\n';

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

    // Handle client disconnect
    res.on('close', () => {
      console.log(`Client ${clientId} disconnected`);
      this.clients.delete(clientId);
      res.end();
    });
  }

  emitEvent(clientId: string, eventType: string, payload: any) {
    // If clientId is 'broadcast', send to all (useful for admin view)
    if (clientId === 'broadcast') {
      this.clients.forEach((clientRes) => {
        clientRes.write(`data: ${JSON.stringify({ type: eventType, payload })}\n\n`);
      });
      return;
    }

    const clientRes = this.clients.get(clientId);
    if (clientRes) {
      clientRes.write(`data: ${JSON.stringify({ type: eventType, payload })}\n\n`);
    }
  }
}

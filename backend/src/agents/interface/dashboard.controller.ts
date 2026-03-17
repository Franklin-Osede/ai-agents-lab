import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { DashboardEventsService } from '../infrastructure/dashboard/dashboard-events.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly eventsService: DashboardEventsService) {}

  @Get('events/:clientId')
  subscribeToEvents(@Param('clientId') clientId: string, @Res() res: Response) {
    this.eventsService.addClient(clientId, res);
  }
}

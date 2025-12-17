import { Controller, Post, Body, Patch, Param, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRiderDto } from './dtos/create-rider.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { RiderResponseDto, RiderLocationResponseDto } from './dtos/rider-response.dto';
import { SimulationService } from '../application/services/simulation.service';

@ApiTags('Rider Agent')
@Controller('agents/rider')
export class RiderAgentController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('riders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new rider',
    description: 'Registers a new rider in the system (SaaS multi-tenant aware)',
  })
  @ApiResponse({ status: 201, description: 'Rider created successfully', type: RiderResponseDto })
  async createRider(
    @Req() req: Request & { tenant?: { id: string } },
    @Body() createRiderDto: CreateRiderDto,
  ): Promise<RiderResponseDto & { message: string }> {
    // In real implementation, this would save to DB
    const tenantId = req.tenant?.id || 'demo-tenant';
    return {
      message: 'Rider created', // Wrapper to match generic response structure if needed, or return raw DTO
      id: 'new-rider-id',
      tenantId,
      ...createRiderDto,
    };
  }

  @Patch('riders/:id/location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update rider location',
    description: 'Updates the GPS coordinates of a specific rider',
  })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    type: RiderLocationResponseDto,
  })
  updateLocation(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
    // This receives real updates from the Rider App
    // We could emit this via WebSocket too
    return {
      message: 'Location updated',
      riderId: id,
      location: updateLocationDto,
    };
  }
}

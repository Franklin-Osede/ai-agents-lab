import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingAgentService } from '../application/services/booking-agent.service';
import { ProcessBookingRequestDto } from './dto/process-booking-request.dto';
import { BookingResponseDto } from './dto/booking-response.dto';

import { BookingAgentChainService } from '../application/services/booking-agent-chain.service';

@ApiTags('Booking Agent')
@Controller('agents/booking')
export class BookingAgentController {
  constructor(
    private readonly bookingAgentService: BookingAgentService,
    private readonly chainService: BookingAgentChainService,
  ) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with the booking agent (N8N compatible)' })
  async chat(@Body() body: { message: string; sessionId: string; businessId: string }) {
    const response = await this.chainService.processRequest(body.message, {
      businessId: body.businessId || 'default-business',
      customerId: body.sessionId,
    });
    
    // Try to parse as JSON (if enhanced response) or return as string
    try {
      const parsed = JSON.parse(response);
      return parsed; // Return enhanced response with bookingStatus, etc.
    } catch {
      // If not JSON, return as simple response
      return { response };
    }
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a booking request' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async processBooking(@Body() dto: ProcessBookingRequestDto): Promise<BookingResponseDto> {
    try {
      const result = await this.bookingAgentService.processBookingRequest({
        message: dto.message,
        customerId: dto.customerId,
        businessId: dto.businessId,
        context: dto.context,
      });

      if (result.isFailure) {
        console.error('BookingAgentService error:', result.error);
        return {
          success: false,
          message: result.error?.message || 'An error occurred processing your request',
          intent: {
            type: 'UNKNOWN',
            confidence: 0,
          },
        };
      }

      return result.value;
    } catch (error) {
      console.error('Controller error:', error);
      return {
        success: false,
        message: (error as Error).message || 'An error occurred processing your request',
        intent: {
          type: 'UNKNOWN',
          confidence: 0,
        },
      };
    }
  }
}

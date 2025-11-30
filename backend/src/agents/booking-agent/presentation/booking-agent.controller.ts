import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingAgentService } from '../application/services/booking-agent.service';
import { ProcessBookingRequestDto } from './dto/process-booking-request.dto';
import { BookingResponseDto } from './dto/booking-response.dto';

@ApiTags('Booking Agent')
@Controller('agents/booking')
export class BookingAgentController {
  constructor(private readonly bookingAgentService: BookingAgentService) {}

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

import { ApiProperty } from '@nestjs/swagger';

export class BookingResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  suggestedTimes?: string[];

  @ApiProperty({ required: false })
  bookingId?: string;

  @ApiProperty({ required: false })
  intent?: {
    type: string;
    confidence: number;
  };
}

import { ApiProperty } from '@nestjs/swagger';

export class BookingEntitiesDto {
  @ApiProperty({ type: [String] })
  dates: string[];

  @ApiProperty({ type: [String] })
  times: string[];

  @ApiProperty({ type: [String] })
  services: string[];

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  people?: number;
}

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

  @ApiProperty({ required: false, type: BookingEntitiesDto })
  entities?: BookingEntitiesDto;
}

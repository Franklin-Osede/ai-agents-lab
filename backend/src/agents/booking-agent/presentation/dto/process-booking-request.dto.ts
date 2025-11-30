import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessBookingRequestDto {
  @ApiProperty({ description: 'Customer message requesting a booking' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Business ID' })
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ description: 'Customer ID', required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Business context', required: false })
  @IsOptional()
  context?: Record<string, unknown>;
}

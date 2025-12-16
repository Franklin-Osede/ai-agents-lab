import { ApiProperty } from '@nestjs/swagger';

export class RiderResponseDto {
  @ApiProperty({ example: 'new-rider-id' })
  id: string;

  @ApiProperty({ example: 'Mario Bros' })
  name: string;

  @ApiProperty({ example: 'idle', enum: ['idle', 'delivering', 'offline'] })
  status: string;

  @ApiProperty({ example: '+1234567890', required: false })
  phone_number?: string;

  @ApiProperty({ example: 'demo-tenant' })
  tenantId: string;
}

export class RiderLocationResponseDto {
  @ApiProperty({ example: 'Location updated' })
  message: string;

  @ApiProperty({ example: 'rider-123' })
  riderId: string;

  @ApiProperty()
  location: {
    lat: number;
    lng: number;
  };
}

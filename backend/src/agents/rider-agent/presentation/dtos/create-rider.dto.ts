import { ApiProperty } from '@nestjs/swagger';

export class CreateRiderDto {
  @ApiProperty({ example: 'Luigi', description: 'Name of the rider' })
  name: string;

  @ApiProperty({ example: '+525512345678', required: false, description: 'Contact phone number' })
  phone_number?: string;

  @ApiProperty({ example: 'idle', enum: ['idle', 'delivering', 'offline'], description: 'Initial status of the rider' })
  status: 'idle' | 'delivering' | 'offline';
}

import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: 19.432608, description: 'Latitude' })
  lat: number;

  @ApiProperty({ example: -99.133209, description: 'Longitude' })
  lng: number;
}

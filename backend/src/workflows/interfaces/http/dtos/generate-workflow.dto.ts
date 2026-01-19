import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateWorkflowDto {
  @ApiProperty({ description: 'ID of the Knowledge Source to base the workflow on' })
  @IsString()
  @IsNotEmpty()
  sourceId: string;

  @ApiProperty({
    description: 'Business niche (e.g., dental, restaurant, legal)',
    example: 'dental',
  })
  @IsString()
  @IsNotEmpty()
  niche: string;
}

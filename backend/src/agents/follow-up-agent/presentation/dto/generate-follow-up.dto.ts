import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateFollowUpDto {
  @ApiProperty({ description: 'Business ID' })
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Last interaction message' })
  @IsString()
  @IsNotEmpty()
  lastInteraction: string;

  @ApiProperty({ description: 'Days since last contact', minimum: 0 })
  @IsNumber()
  @Min(0)
  daysSinceLastContact: number;

  @ApiProperty({ description: 'Previous intent', required: false })
  @IsString()
  @IsOptional()
  previousIntent?: string;

  @ApiProperty({ description: 'Additional context', required: false })
  @IsOptional()
  context?: Record<string, any>;
}

import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageChannel } from '../../domain/entities/message.entity';

export class ProcessDmRequestDto {
  @ApiProperty({ description: 'Customer message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Business ID' })
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Channel type', enum: MessageChannel })
  @IsEnum(MessageChannel)
  channel: MessageChannel;

  @ApiProperty({ description: 'Additional context', required: false })
  @IsOptional()
  context?: Record<string, any>;
}

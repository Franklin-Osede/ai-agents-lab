import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { VoiceChannel } from '../../domain/value-objects/voice-message';

export class GenerateVoiceDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Business ID' })
  @IsString()
  businessId: string;

  @ApiProperty({
    description: 'Context for personalization (e.g., "Cliente consultó sobre botox hace 3 días")',
  })
  @IsString()
  context: string;

  @ApiProperty({ enum: VoiceChannel, description: 'Channel to send the message' })
  @IsEnum(VoiceChannel)
  channel: VoiceChannel;

  @ApiProperty({ required: false, description: 'Include video generation' })
  @IsOptional()
  @IsBoolean()
  includeVideo?: boolean;

  @ApiProperty({ required: false, description: 'URL of avatar image for video generation' })
  @IsOptional()
  @IsUrl()
  avatarImageUrl?: string;

  @ApiProperty({ required: false, description: 'Customer name for personalization' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ required: false, description: 'Language code (default: es)' })
  @IsOptional()
  @IsString()
  language?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class VoiceInteractDto {
  @ApiProperty({
    description: 'System prompt to guide the AI response',
    example: 'You are a helpful assistant for abandoned cart recovery.',
    required: false,
  })
  @IsString()
  @IsOptional()
  systemPrompt?: string;
}

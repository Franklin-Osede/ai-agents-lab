import { ApiProperty } from '@nestjs/swagger';

export class VoiceResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  script: string;

  @ApiProperty()
  audioUrl: string;

  @ApiProperty({ required: false })
  videoUrl?: string;

  @ApiProperty({ required: false })
  duration?: number;

  @ApiProperty({ required: false })
  channel?: string;

  @ApiProperty({ description: 'Estimated cost in USD' })
  estimatedCost: number;

  @ApiProperty({ required: false })
  message?: string;
}

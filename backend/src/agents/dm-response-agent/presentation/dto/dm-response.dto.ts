import { ApiProperty } from '@nestjs/swagger';

export class DmResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  response: string;

  @ApiProperty()
  intent: {
    type: string;
    confidence: number;
  };

  @ApiProperty({ required: false })
  suggestedActions?: string[];
}

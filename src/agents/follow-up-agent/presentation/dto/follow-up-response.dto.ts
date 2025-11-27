import { ApiProperty } from '@nestjs/swagger';
import { FollowUpUrgency } from '../../domain/entities/follow-up.entity';

export class FollowUpResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: FollowUpUrgency })
  urgency: FollowUpUrgency;

  @ApiProperty()
  suggestedNextSteps: string[];
}

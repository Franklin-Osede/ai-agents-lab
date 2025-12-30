import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateRideDto {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsNotEmpty()
  @IsString()
  @IsString()
  @IsUUID()
  userId: string;

  @IsString()
  riderName?: string;
}

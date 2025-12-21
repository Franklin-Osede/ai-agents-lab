import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateRideDto {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;
}

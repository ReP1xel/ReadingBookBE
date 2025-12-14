import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'iiiimanhiiii007@gmail.com', type: String })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

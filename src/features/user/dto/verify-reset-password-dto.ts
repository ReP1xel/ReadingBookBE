import { IsNotEmpty, Length } from 'class-validator';
import { ResetPasswordDto } from './reset-password.dto';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetPasswordDto extends ResetPasswordDto {
  @ApiProperty({ example: '472893', type: String })
  @Length(6, 6, { message: 'OTP phải có đúng 6 chữ số' })
  @IsNotEmpty()
  otp: string;
}

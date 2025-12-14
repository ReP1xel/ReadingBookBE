import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { UserResponseDto } from './get-user-response.dto';

export class LoginDto {
  @ApiProperty({ example: 'iiiimanhiiii007@gmail.com', type: 'string' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ example: '123456', type: 'string' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
  expiresIn?: number;
  user: UserResponseDto;
}

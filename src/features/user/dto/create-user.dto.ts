import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GENDER_ENUM } from '../entities/user.entity';
import { UserSettingsDto } from './user-setting.dto';

export class CreateUserDto {
  @ApiProperty({ example: 'iiiimanhiiii007@gmail.com', type: String })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', type: String })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsNotEmpty()
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Minh Thuận', type: String })
  @IsNotEmpty()
  @IsString({ message: 'Tên người dùng phải là chuỗi' })
  name: string;

  @ApiPropertyOptional({
    example: 'male',
    enum: ['male', 'female', 'other'],
    description: 'Giới tính của người dùng (optional)',
  })
  @IsOptional()
  @IsEnum(GENDER_ENUM, { message: 'Giới tính không hợp lệ' })
  gender: GENDER_ENUM;

  @ApiPropertyOptional({
    example: 'https://google.com.vn (optional)',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Ảnh đại diện phỉa là chuỗi' })
  avatar?: string;

  @ApiPropertyOptional({ example: '2000-02-14 (optional)', type: String })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Ngày sinh không hợp lệ, định dạng ISO (YYYY-MM-DD)' },
  )
  birthDate?: string;

  @ApiPropertyOptional({
    example: 'Tôi là một lập trình viên thích đọc sách (optional)',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Giới thiệu phải là chuỗi' })
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://facebook.com/yourprofile (optional)',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Facebook link phải là chuỗi' })
  facebook?: string;

  @ApiPropertyOptional({
    example: 'https://twitter.com/yourhandle (optional)',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Twitter phải là chuỗi' })
  twitter?: string;

  @ApiPropertyOptional({
    example: 'https://instagram.com/yourhandle (optional)',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Instagram phải là chuỗi' })
  instagram?: string;

  @ApiPropertyOptional({
    example: {
      language: 'en',
      theme: 'light',
      volume: 50,
      readingMode: 'scroll',
    },
    type: UserSettingsDto,
    description: 'Cài đặt của người dùng (optional)',
  })
  preferences: UserSettingsDto;


  @IsNumber()
  roleId: number = 3;

  @IsNumber()
  statusId: number = 1;
}

export class CreateManagerDto {
  @ApiProperty({
    example: 'manager@example.com',
    description: 'Email của Manager',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu (tối thiểu 6 ký tự)',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Manager Name', description: 'Tên của Manager' })
  @IsNotEmpty()
  name: string;
}

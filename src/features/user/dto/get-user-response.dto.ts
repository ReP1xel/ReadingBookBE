import { ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { GENDER_ENUM } from '../entities/user.entity';
import { UserSettingsDto } from './user-setting.dto';


class RoleDto {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  name: string;
}

class StatusDto {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  name: string;
}

export class UserResponseDto {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  email: string;

  @Exclude()
  @IsString()
  password?: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsOptional()
  @IsString()
  gender?: GENDER_ENUM;

  @Expose()
  @IsOptional()
  @IsString()
  avatar?: string;

  @Expose()
  @IsOptional()
  @IsString()
  birthDate?: Date;

  @Expose()
  @IsOptional()
  @IsString()
  bio?: string;

  @Expose()
  @IsOptional()
  @IsString()
  facebook?: string;

  @Expose()
  @IsOptional()
  @IsString()
  twitter?: string;

  @Expose()
  @IsOptional()
  @IsString()
  instagram?: string;

  @Expose()
  @IsOptional()
  @Type(() => RoleDto)
  role?: RoleDto;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenBalance?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenSpent?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenReceived?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenPurchased?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenWithdrawn?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenEarned?: number;

  @Expose()
  @IsOptional()
  @Type(() => StatusDto)
  status?: StatusDto;

  @Expose()
  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @Exclude()
  @IsOptional()
  @IsDate()
  updateAt?: Date;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isVip?: boolean;
}

export class UserProfileResponseDto extends UserResponseDto {
  
  @Expose()
  @IsNumber()
  readingStats: {
    booksRead: number;
    chaptersRead: number;
  };

  @Expose()
  @IsOptional()
  @Type(() => UserSettingsDto)
  preferences?: UserSettingsDto;

  @IsOptional()
  @Expose()
  books?: {
    id: number;
    title: string;
    description: string;
    cover: string;
    createdAt: Date;
  }[];

  @IsOptional()
  @Expose()
  isVip?: boolean;
}

export class GetUsersFilterDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({ example: 'admin@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID của trạng thái người dùng',
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  status?: number;

  @ApiPropertyOptional({ example: 2, description: 'ID của vai trò' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  role?: number;
}

export class UserPublicDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  @IsOptional()
  @IsString()
  avatar?: string;

  @Expose()
  @IsOptional()
  @IsString()
  bio?: string;

  @Expose()
  @IsOptional()
  @IsString()
  facebook?: string;

  @Expose()
  @IsOptional()
  @IsString()
  twitter?: string;

  @Expose()
  @IsOptional()
  @IsString()
  instagram?: string;
}

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JwtPayloadDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  avatar: string;

  @IsNotEmpty()
  @ValidateNested()
  role: { id: number; name: string };

  @IsNotEmpty()
  @IsString()
  birthDate: string;

  @IsNotEmpty()
  @IsString()
  points: string;

  @IsNotEmpty()
  @ValidateNested()
  status: { id: number; name: string };

  @IsNotEmpty()
  @IsString()
  createdAt: string;

  @IsOptional()
  @IsNumber()
  iat?: number;

  @IsOptional()
  @IsNumber()
  exp?: number;
}

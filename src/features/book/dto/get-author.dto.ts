import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AuthorDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  id: number;

  @IsOptional()
  @IsString()
  @Expose()
  email?: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;

  @IsOptional()
  @IsString()
  @Expose()
  avatar?: string;
}

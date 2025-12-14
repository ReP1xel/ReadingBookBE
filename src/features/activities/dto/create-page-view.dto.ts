import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreatePageViewDto {
  @IsUUID()
  @IsNotEmpty()
  visitId: string;

  @IsOptional()
  @IsNumber()
  chapterId?: number;

  @IsOptional()
  @IsNumber()
  bookId?: number;

  @IsNotEmpty()
  @IsString()
  @IsUrl({ require_tld: false })
  url: string;
} 
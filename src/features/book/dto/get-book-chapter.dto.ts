import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { GetBookDto } from './get-book.dto';

export class GetBookChapterDto {
  @IsNotEmpty()
  @Expose()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @Expose()
  @Type(() => GetBookDto)
  book: GetBookDto;

  @IsNotEmpty()
  @Expose()
  @IsString()
  title: string;

  @IsNotEmpty()
  @Expose()
  @IsNumber()
  chapter: string;

  @IsNotEmpty()
  @Expose()
  @IsString()
  content: string;

  @Expose()
  @IsOptional()
  @IsString()
  cover?: string;

  @IsNotEmpty()
  @Expose()
  @IsBoolean()
  isLocked: boolean;

  @IsNotEmpty()
  @Expose()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  price: number;

  @IsNotEmpty()
  @Expose()
  createdAt: Date;

  @IsOptional()
  @Expose()
  moderated: string;

  @IsOptional()
  @Expose()
  chapterAccessStatus: string;
}

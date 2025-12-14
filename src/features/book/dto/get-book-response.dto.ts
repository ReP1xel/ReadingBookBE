import { Expose, Type } from 'class-transformer';
import { GetProgressStatusDto } from './get-book-progess-status.dto';
import { GetAccessStatusDto } from './get-book-access-status.dto';
import { GetBookCategoryDto } from './get-book-category.dto';
import { AuthorDto } from './get-author.dto';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class GetBookDto {
  @IsNumber()
  @Expose()
  id: number;

  @IsString()
  @Expose()
  title: string;

  @IsString()
  @Expose()
  description: string;

  @IsString()
  @Expose()
  cover: string;

  @IsString()
  @Expose()
  ageRating: number;

  @IsString()
  @Expose()
  views: number;

  @IsDate()
  @Expose()
  createdAt: Date;

  @IsDate()
  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => AuthorDto)
  author: AuthorDto;

  @Expose()
  @Type(() => GetAccessStatusDto)
  accessStatus: GetAccessStatusDto;

  @Expose()
  @Type(() => GetProgressStatusDto)
  progressStatus: GetProgressStatusDto;

  @Expose()
  @Type(() => GetBookCategoryDto)
  bookCategoryRelations: GetBookCategoryDto[];
}

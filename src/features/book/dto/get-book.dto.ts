import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { GetBookChapterDto } from './get-book-chapter.dto';
import { GetBookCategoryDto } from './get-book-category.dto';
import { AuthorDto } from './get-author.dto';
import { BookReview } from './get-book-review.dto';
import { GetProgressStatusDto } from './get-book-progess-status.dto';
import { GetAccessStatusDto } from './get-book-access-status.dto';
import { GetBookTypeDto } from './book-type.dto';

export class GetListBookDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  id: number;

  @IsNotEmpty()
  @IsString()
  @Expose()
  title: string;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @IsOptional()
  @IsString()
  @Expose()
  cover?: string;

  @IsOptional()
  @IsNumber()
  @Expose()
  views?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  totalChapters?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  totalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  totalReads?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  totalPurchases?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  followsCount: number;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isFollowed: boolean;

  @IsNotEmpty()
  @Expose()
  @Type(() => AuthorDto)
  author: AuthorDto;

  @IsNotEmpty()
  @Expose()
  @Type(() => GetBookTypeDto)
  bookType: GetBookTypeDto;

  @IsNotEmpty()
  @Expose()
  @Type(() => GetAccessStatusDto)
  accessStatus: GetAccessStatusDto;

  @IsNotEmpty()
  @Expose()
  @Type(() => GetProgressStatusDto)
  progressStatus: GetProgressStatusDto;

  @IsNotEmpty()
  @Expose()
  @Transform(
    ({ obj }) =>
      obj.bookCategoryRelations?.map(({ category }) => ({
        id: category?.id,
        name: category?.name,
      })) ?? [],
  )
  @Type(() => GetBookCategoryDto)
  @IsArray()
  categories: GetBookCategoryDto[];

  @IsOptional()
  @Expose()
  readingProgress?: {
    lastReadChapterId: number;
    lastReadChapterNumber: number;
    totalReadChapters: number;
  };

  @IsNumber()
  @IsOptional()
  @Expose()
  similarity?: number;

  @IsNotEmpty()
  @Expose()
  createdAt: Date;

  @IsNotEmpty()
  @Expose()
  updatedAt: Date;

  @IsOptional()
  @Expose()
  moderated: string;

  @IsOptional()
  @Expose()
  ageRating: number;

  @IsOptional()
  @Expose()
  moderation?: any[];
}

export class GetBookDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  id: number;

  @IsNotEmpty()
  @IsString()
  @Expose()
  title: string;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @IsOptional()
  @IsString()
  @Expose()
  cover?: string;

  @IsOptional()
  @IsNumber()
  @Expose()
  views?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  followsCount: number;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isFollowed: boolean;

  @IsNotEmpty()
  @Expose()
  @Type(() => GetBookTypeDto)
  bookType: GetBookTypeDto;

  @IsNotEmpty()
  @Expose()
  @Type(() => GetAccessStatusDto)
  accessStatus: GetAccessStatusDto;

  @IsNotEmpty()
  @Expose()
  @Type(() => GetProgressStatusDto)
  progressStatus: GetProgressStatusDto;

  @IsNotEmpty()
  @Expose()
  @Type(() => AuthorDto)
  author: AuthorDto;

  @IsNotEmpty()
  @Expose()
  @Transform(
    ({ obj }) =>
      obj.bookCategoryRelations?.map((relation: any) => ({
        id: relation.category?.id,
        name: relation.category?.name,
      })) || [],
  )
  @Type(() => GetBookCategoryDto)
  @IsArray()
  categories: GetBookCategoryDto[];

  @IsOptional()
  @Expose()
  @Type(() => GetBookChapterDto)
  chapters?: GetBookChapterDto[];

  @IsOptional()
  @Expose()
  @Type(() => BookReview)
  reviews?: BookReview[];

  @IsNotEmpty()
  @Expose()
  createdAt: Date;

  @IsOptional()
  @Expose()
  moderated: string;

  @IsOptional()
  @Expose()
  ageRating: number;
}

export class GetBookDetail {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  id: number;

  @IsNotEmpty()
  @IsString()
  @Expose()
  title: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  description: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  cover: string;

  @IsNotEmpty()
  @IsNumber()
  @Expose()
  views: number;

  @IsNotEmpty()
  @IsNumber()
  @Expose()
  rating: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  totalChapters?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  totalPrice?: number;

  @IsNotEmpty()
  @IsNumber()
  @Expose()
  totalReads: number;

  @IsNotEmpty()
  @IsNumber()
  @Expose()
  totalPurchases: number;

  @IsNotEmpty()
  @IsNumber()
  @Expose()
  followsCount: number;

  @IsNotEmpty()
  @IsBoolean()
  @Expose()
  isFollowed: boolean;

  @IsNotEmpty()
  @Expose()
  @Type(() => GetBookTypeDto)
  bookType: GetBookTypeDto;

  @IsNotEmpty()
  @Expose()
  @Type(() => GetAccessStatusDto)
  accessStatus: GetAccessStatusDto;

  @IsNotEmpty()
  @Expose()
  @Type(() => GetProgressStatusDto)
  progressStatus: GetProgressStatusDto;

  @IsNotEmpty()
  @Expose()
  @Type(() => AuthorDto)
  author: AuthorDto;

  @IsNotEmpty()
  @Expose()
  @Transform(
    ({ obj }) =>
      obj.bookCategoryRelations?.map((relation: any) => ({
        id: relation.category?.id,
        name: relation.category?.name,
      })) || [],
  )
  @Type(() => GetBookCategoryDto)
  @IsArray()
  categories: GetBookCategoryDto[];

  @IsNotEmpty()
  @Expose()
  createdAt: Date;

  @IsOptional()
  @Expose()
  moderated: string;

  @IsOptional()
  @Expose()
  ageRating: number;
}

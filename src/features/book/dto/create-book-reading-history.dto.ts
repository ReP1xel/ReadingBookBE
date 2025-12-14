import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { GetBookDto } from './get-book.dto';
import { Expose, Transform, Type } from 'class-transformer';
import { GetBookChapterDto } from './get-book-chapter.dto';
import { AuthorDto } from './get-author.dto';
import { GetBookCategoryDto } from './get-book-category.dto';
import { GetBookTypeDto } from './book-type.dto';
import { GetAccessStatusDto } from './get-book-access-status.dto';
import { GetProgressStatusDto } from './get-book-progess-status.dto';

export class CreateBookReadingHistoryDto {
  @ApiProperty({ example: 1, description: 'ID của sách mà user đang đọc' })
  @IsNotEmpty()
  @IsNumber()
  bookId: number;

  @ApiProperty({ example: 3, description: 'ID của chapter mà user đang đọc' })
  @IsNotEmpty()
  @IsNumber()
  chapterId: number;
}

export class BookMiniResponseDto {
  @ApiProperty({ example: 3, description: 'ID của chapter' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'tiều đề chapter', description: 'Tiều đề chapter' })
  @Expose()
  title: string;
}

export class BookReadingHistoryResponseDto {
  @ApiProperty({ example: 1, description: 'ID của lịch sử đọc sách' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Thông tin sách', type: GetBookDto })
  @Expose()
  @Type(() => GetBookDto)
  book: GetBookDto;

  @ApiProperty({
    description: 'Thông tin chapter mà user đã đọc',
    type: GetBookChapterDto,
  })
  @Expose()
  @Type(() => BookMiniResponseDto)
  chapter: BookMiniResponseDto;

  @ApiProperty({
    example: '2025-03-21T17:32:33.692Z',
    description: 'Thời điểm lịch sử được tạo',
  })
  @Expose()
  createdAt: Date;
}

export class ChapterReadDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  lastReadAt: Date;

  @Expose()
  chapter: number;

  @Expose()
  isLocked: boolean;
}

export class BookReadingSummaryDto {
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
  @Type(() => GetBookCategoryDto)
  @IsArray()
  categories: GetBookCategoryDto[];

  @IsNotEmpty()
  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => ChapterReadDto)
  chaptersRead: ChapterReadDto[];
}

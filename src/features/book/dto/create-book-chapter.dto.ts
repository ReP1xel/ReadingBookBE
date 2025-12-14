import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ChapterAccessStatus } from '../entities/book-chapter.entity';

export class CreateBookChapterDto {
  @ApiProperty({
    description: 'Tiêu đề của chương sách',
    example: 'Chương 1: Hành trình bắt đầu',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Số thứ tự chương trong sách',
    example: 1,
  })
  @IsNumber()
  chapter: number;

  @ApiProperty({
    description: 'Nội dung của chương sách',
    example: 'Ngày xưa, có một...',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'URL ảnh bìa của chương sách (nếu có)',
    example: 'https://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiPropertyOptional({
    description: 'Chương có bị khóa hay không (true = khóa, false = mở)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiPropertyOptional({
    description: 'Giá của chương sách (nếu có trả phí)',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(ChapterAccessStatus)
  chapterAccessStatus?: ChapterAccessStatus;

  @ApiPropertyOptional({
    description: 'Trạng thái kiểm duyệt của chương sách',
    example: 'approved',
  })
  @IsOptional()
  @IsString()
  moderated?: string;
}

export class MultiChapterDto {
  @ApiProperty({
    description: 'Tiêu đề của chương sách',
    example: 'Chương 1: Hành trình bắt đầu',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Số thứ tự chương trong sách',
    example: 1,
  })
  @IsNumber()
  chapter: number;

  @ApiProperty({
    description: 'Nội dung của chương sách',
    example: 'Ngày xưa, có một...',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'URL ảnh bìa của chương sách (nếu có)',
    example: 'https://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    description: 'Trạng thái kiểm duyệt của chương sách',
    example: 'approved',
  })

  @IsOptional()
  @IsEnum(ChapterAccessStatus)
  chapterAccessStatus?: ChapterAccessStatus;

  @IsOptional()
  @IsString()
  moderated?: string;
}

export class CreateMultipleBookChaptersDto {
  @ApiProperty({
    description: 'Danh sách các chương sách',
    type: [MultiChapterDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultiChapterDto)
  chapters: MultiChapterDto[];
}

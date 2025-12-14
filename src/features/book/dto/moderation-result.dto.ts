import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class CreateModerationResultDto {
  @ApiProperty({
    description: 'Book ID',
    example: 1
  })
  @IsNumber()
  bookId: number;

  @ApiProperty({
    description: 'AI model used for moderation',
    example: 'gpt-4-turbo'
  })
  @IsString()
  model: string;

  @ApiPropertyOptional({
    description: 'Moderation result for the title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Moderation result for the description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Moderation result for the cover image',
  })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Moderation result for the chapters',
  })
  @IsString()
  @IsOptional()
  chapters?: string;
}

export class UpdateModerationResultDto {
  @ApiProperty({
    description: 'Book ID',
    example: 1
  })
  @IsNumber()
  bookId: number;

  @ApiProperty({
    description: 'AI model used for moderation',
    example: 'gpt-4-turbo'
  })
  @IsString()
  model: string;

  @ApiPropertyOptional({
    description: 'Moderation result for the title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Moderation result for the description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Moderation result for the cover image',
  })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Moderation result for the chapters',
  })
  @IsString()
  @IsOptional()
  chapters?: string;
}

export class GetModerationResultDto {
  @ApiProperty({
    description: 'Book ID',
    example: 1
  })
  @IsNumber()
  bookId: number;

  @ApiPropertyOptional({
    description: 'AI model used for moderation (optional)',
    example: 'gpt-4-turbo'
  })
  @IsString()
  @IsOptional()
  model?: string;
}

export class BookSimpleDto {
  @Expose()
  id: number;

  @Expose()
  title: string;
}

export class ModerationResultResponseDto {
  @Expose()
  id: number;

  @Expose()
  @Type(() => BookSimpleDto)
  book: BookSimpleDto;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  coverImage: string;

  @Expose()
  chapters: string;

  @Expose()
  model: string;

  @Expose()
  @Transform(({ value }) => value && new Date(value).toISOString())
  createdAt: Date;
} 
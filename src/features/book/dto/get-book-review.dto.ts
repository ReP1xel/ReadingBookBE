import { Expose, Type } from 'class-transformer';
import { AuthorDto } from './get-author.dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BookReview {
  @IsNotEmpty()
  @Expose()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @Expose()
  @Type(() => AuthorDto)
  user: AuthorDto;

  @IsNotEmpty()
  @Expose()
  @IsNumber()
  rating: number;

  @Expose()
  @IsOptional()
  @IsString()
  comment?: string;

  @IsNotEmpty()
  @Expose()
  createdAt: Date;
}

export class BookReviewResponseDto {
  @ApiProperty({ example: 501 })
  @Expose()
  id: number;

  @ApiProperty({ example: 5 })
  @Expose()
  rating: number;

  @ApiProperty({ example: 'This is review 2 for book 1' })
  @Expose()
  comment: string;

  @ApiProperty({ example: '2025-03-21T21:59:43.358Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: AuthorDto })
  @Type(() => AuthorDto)
  @Expose()
  user: AuthorDto;
}

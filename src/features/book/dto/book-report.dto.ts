import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { AuthorDto } from './get-author.dto';
import { Expose, Type } from 'class-transformer';
import { GetBookDto } from './get-book.dto';

export class BookReportDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  bookId: number;

  @ApiProperty({ example: 'Nội dung không phù hợp' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class BookReportResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Nội dung không phù hợp' })
  @Expose()
  reason: string;

  @ApiProperty({ example: false })
  @Expose()
  resolved: boolean;

  @ApiProperty()
  @Expose()
  @Type(() => AuthorDto)
  user: AuthorDto;

  @ApiProperty({ type: GetBookDto })
  @Expose()
  @Type(() => GetBookDto)
  book: GetBookDto;

  @ApiProperty({ example: '2025-03-21T17:32:33.692Z' })
  @Expose()
  createdAt: Date;
}

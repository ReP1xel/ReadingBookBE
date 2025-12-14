import { AuthorDto } from '@features/book/dto/get-author.dto';
import { GetBookChapterDto } from '@features/book/dto/get-book-chapter.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateChapterPurchaseDto {
  @ApiProperty({ example: 42, description: 'ID của chapter muốn mua' })
  @IsInt()
  @Min(1)
  chapterId: number;
}

export class ChapterPurchaseResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  price: number;

  @ApiProperty()
  @Type(() => AuthorDto)
  @Expose()
  user: AuthorDto;

  @ApiProperty()
  @Type(() => GetBookChapterDto)
  @Expose()
  chapter: GetBookChapterDto;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}

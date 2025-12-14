import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { AuthorDto } from './get-author.dto';
import { Expose, Transform, Type } from 'class-transformer';

export class CreateBookChapterCommentDto {
  @ApiProperty({ example: 1, description: 'ID của chapter' })
  @IsNotEmpty()
  @IsNumber()
  chapterId: number;

  @ApiProperty({
    example: 'Bình luận hay quá!',
    description: 'Nội dung bình luận',
  })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'ID của bình luận cha (nếu là reply)',
  })
  @IsOptional()
  @IsNumber()
  parentId?: number;
}

export class UpdateBookChapterCommentDto {
  @ApiProperty({
    description: 'Nội dung mới của bình luận',
    example: 'Cập nhật: chương này siêu hay!',
  })
  @IsNotEmpty()
  @IsString()
  comment: string;
}

export class BookChapterCommentResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Cập nhật: chương này siêu hay!' })
  @Expose()
  comment: string;

  @ApiProperty({ example: '2025-03-21T17:32:33.692Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    type: AuthorDto,
    description: 'Thông tin của người viết bình luận',
  })
  @Expose()
  @Type(() => AuthorDto)
  user: AuthorDto;

  @ApiPropertyOptional({
    example: 5,
    description: 'ID của bình luận cha (nếu có)',
  })
  @Expose()
  @Transform(({ obj }) => (obj.parent ? obj.parent.id : undefined))
  parentId?: number;

  @ApiPropertyOptional({
    type: [BookChapterCommentResponseDto],
    description: 'Danh sách bình luận con (nếu có)',
  })
  @Expose()
  @Type(() => BookChapterCommentResponseDto)
  children?: BookChapterCommentResponseDto[];

  @Expose()
  @ApiPropertyOptional({
    example: 1,
    description: 'Tổng số bình luận con',
  })
  totalChildComments: number;
}

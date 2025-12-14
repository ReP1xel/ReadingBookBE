import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Adventure' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'A thrilling adventure of ...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg' })
  @IsNotEmpty()
  @IsString()
  cover: string;

  @ApiProperty({ example: 12, description: 'Độ tuổi phù hợp' })
  @IsNotEmpty()
  @IsNumber()
  ageRating: number;

  @ApiProperty({
    example: 1,
    description: 'ID của loại sách (1: Novel, 2: Manga)',
  })
  @IsNotEmpty()
  @IsNumber()
  bookTypeId: number;

  @ApiProperty({ example: 2, description: 'ID của Progress Status' })
  @IsNotEmpty()
  @IsNumber()
  progressStatusId: number;

  @ApiProperty({ example: 1, description: 'ID của Access Status' })
  @IsNotEmpty()
  @IsNumber()
  accessStatusId: number;

  @ApiPropertyOptional({ 
    example: 'approved', 
    description: 'Trạng thái kiểm duyệt'
  })
  @IsOptional()
  @IsString()
  moderated?: string;

  @ApiProperty({
    example: [1, 3, 5],
    description: 'Danh sách các ID của thể loại',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Book must have at least 1 category' })
  @Transform(
    ({ value }) => (Array.isArray(value) ? value.map(Number) : [Number(value)]),
    { toClassOnly: true },
  )
  categoryIds: number[];
}

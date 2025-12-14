import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SearchType } from '../entities/user-recent-search.entity';

export class CreateRecentSearchDto {
  @ApiProperty({
    enum: SearchType,
    description: 'Type of search (book or author)',
    example: SearchType.BOOK
  })
  @IsEnum(SearchType)
  @IsNotEmpty()
  searchType: SearchType;

  @ApiProperty({
    description: 'Search query value',
    example: 'Harry Potter'
  })
  @IsString()
  @IsNotEmpty()
  searchValue: string;

  @ApiPropertyOptional({
    description: 'Related ID (bookId or authorId if matched)',
    example: 1,
    type: Number
  })
  @IsNumber()
  @IsOptional()
  relatedId?: number;
} 
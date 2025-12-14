import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationRequestDto } from '@shared/dto/common/pagnination/pagination-request.dto';
import { PaginationResponseDto } from '@shared/dto/common/pagnination/pagination-response.dto';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetBookCategoryDto {
  @IsOptional()
  @Expose()
  @IsNumber()
  id?: number;

  @IsOptional()
  @Expose()
  @IsString()
  name?: string;

  @IsOptional()
  @Expose()
  @IsNumber()
  totalBooks?: number;
}

export class GetBookCategoryRequestDto extends PaginationRequestDto {}

export class GetBookCateogryResponseDto extends PaginationResponseDto<GetBookCategoryDto> {}

export enum SortByOptions {
  TITLE = 'title',
  VIEWS = 'views',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortTypeOptions {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetBookCategoryDetailDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  userId?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Từ khóa tìm kiếm (title và author)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Lọc sách theo loại Manga hay Novel (bookTypeId)',
  })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  bookTypeId?: number;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Lọc theo nhiều trạng thái truy cập (accessStatusId)',
  })
  @IsOptional()
  @IsArray()
  @Transform(
    ({ value }) => (Array.isArray(value) ? value.map(Number) : [Number(value)]),
    { toClassOnly: true },
  )
  accessStatusId?: number[];

  @ApiPropertyOptional({
    type: Number,
    description: 'Lọc sách theo trạng thái hoàn thành (progressStatusId)',
  })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  progressStatusId: number;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Lọc sách theo danh mục',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Transform(
    ({ value }) => (Array.isArray(value) ? value.map(Number) : [Number(value)]),
    { toClassOnly: true },
  )
  categoryId?: number[];

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Lọc sách có ít nhất một chương',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true, {
    toClassOnly: true,
  })
  hasChapters?: boolean;
}

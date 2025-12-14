import { GetBookDto } from './get-book.dto';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { PaginationRequestDto } from '@shared/dto/common/pagnination/pagination-request.dto';
import { PaginationResponseDto } from '@shared/dto/common/pagnination/pagination-response.dto';

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

export class GetBookRequestDto extends PaginationRequestDto {
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

  @ApiPropertyOptional({
    type: String,
    enum: SortByOptions,
    enumName: 'SortByOptions',
    description: 'Sắp xếp theo trường nào',
  })
  @IsOptional()
  @IsEnum(SortByOptions)
  sortBy?: SortByOptions;

  @ApiPropertyOptional({
    type: String,
    enum: SortTypeOptions,
    enumName: 'SortTypeOptions',
    description: 'Kiểu sắp xếp',
  })
  @IsOptional()
  @IsEnum(SortTypeOptions)
  @Transform(
    ({ value }) =>
      value?.toUpperCase() === 'ASC' || value?.toUpperCase() === 'DESC'
        ? value.toUpperCase()
        : 'DESC',
    { toClassOnly: true },
  )
  sortType?: SortTypeOptions;
}

export class GetBookResponseDto extends PaginationResponseDto<GetBookDto> {}

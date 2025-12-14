import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class GetChapterPurchasesDto {
  @ApiProperty({
    example: 1,
    description: 'Trang hiện tại',
    type: Number,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({
    example: 10,
    description: 'Số lượng bản ghi mỗi trang',
    type: Number,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'ID giao dịch', type: String })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Từ ngày (YYYY-MM-DD)',
    type: String,
    example: '2025-04-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Đến ngày (YYYY-MM-DD)',
    type: String,
    example: '2025-04-05',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID sách', type: Number })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  bookId?: number;

  @ApiPropertyOptional({ description: 'ID chương sách', type: Number })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  chapterId?: number;
}

export class GetAdminChapterPurchasesDto extends PickType(
  GetChapterPurchasesDto,
  [
    'page',
    'limit',
    'id',
    'startDate',
    'endDate',
    'bookId',
    'chapterId',
  ] as const,
) {
  @ApiPropertyOptional({ description: 'ID người dùng', type: Number })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ description: 'Email người dùng', type: String })
  @IsOptional()
  @IsString()
  email?: string;
}

export class GetUserChapterPurchasesDto extends PickType(
  GetChapterPurchasesDto,
  [
    'page',
    'limit',
    'id',
    'startDate',
    'endDate',
    'bookId',
    'chapterId',
  ] as const,
) {}

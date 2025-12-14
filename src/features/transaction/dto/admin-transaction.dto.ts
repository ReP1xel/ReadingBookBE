import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';

export class GetAdminTransactionsDto {
  @ApiProperty({
    example: 1,
    description: 'Trang hiện tại',
    type: Number,
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Số lượng bản ghi mỗi trang',
    type: Number,
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  limit: number;

  @ApiPropertyOptional({ description: 'ID giao dịch', type: String })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Email người dùng', type: String })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'ID người dùng', type: Number })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

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

  @ApiPropertyOptional({
    description: 'Trạng thái giao dịch',
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    example: 'SUCCESS',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'SUCCESS', 'FAILED'])
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
}

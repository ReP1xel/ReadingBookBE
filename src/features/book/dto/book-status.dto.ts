import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookStatusDto {
  @ApiPropertyOptional({
    description: 'ID của trạng thái truy cập (access status) cho sách',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  accessStatusId?: number;

  @ApiPropertyOptional({
    description: 'ID của trạng thái tiến trình (progress status) cho sách',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  progressStatusId?: number;
}

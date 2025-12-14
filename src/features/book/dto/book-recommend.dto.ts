import { IsInt, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetRecommendedBooksDto {
  @ApiPropertyOptional({
    example: 15,
    minimum: 1,
    description: 'Số lượng sách tối đa (default: 15)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 15;
}

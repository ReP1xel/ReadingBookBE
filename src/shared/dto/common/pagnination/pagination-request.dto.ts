import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class PaginationRequestDto {
  @ApiProperty({ type: Number, default: 10 })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  limit?: number = 10;

  @ApiProperty({ type: Number, default: 1 })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  page?: number = 1;
}

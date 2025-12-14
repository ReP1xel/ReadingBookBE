import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UserByIdDto {
  @ApiProperty({ example: 1, type: Number })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  id: number;
}

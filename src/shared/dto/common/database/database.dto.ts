import { FindOptionsOrder, FindOptionsWhere } from 'typeorm';
import {
  IsObject,
  IsOptional,
  IsInt,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindOptionsDto<T> {
  @IsOptional()
  @IsObject()
  where?: FindOptionsWhere<T>;

  @IsOptional()
  @IsArray()
  select?: (keyof T)[];

  @IsOptional()
  @IsArray()
  relations?: string[];

  @IsOptional()
  @IsObject()
  order?: FindOptionsOrder<T>;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  take?: number;

  @IsOptional()
  @IsBoolean()
  withDeleted?: boolean;
}

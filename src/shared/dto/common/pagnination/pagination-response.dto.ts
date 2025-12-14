import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class PaginationResponseDto<T> {
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  totalItems: number;

  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  totalPages: number;

  data: T[];
}

export class PaginationNotificationResponseDto<T> {
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  totalItems: number;

  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  totalUnread: number;

  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  totalPages: number;

  data: T[];
}

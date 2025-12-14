import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { GetBookDto } from './get-book.dto';

export class BookFollowDto {
  @ApiProperty({ example: 1, description: 'ID của sách' })
  @IsNotEmpty()
  @IsNumber()
  bookId: number;
}

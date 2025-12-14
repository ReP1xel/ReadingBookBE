import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateBookReviewDto {
  @ApiProperty({ description: 'Số sao đánh giá (1-5)', example: 4 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Nội dung đánh giá', example: 'Sách rất hay!' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateBookReviewDto {
  @ApiProperty({ description: 'Số sao đánh giá (1-5)', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Nội dung đánh giá', example: 'Tuyệt vời!' })
  @IsOptional()
  @IsString()
  comment?: string;
}

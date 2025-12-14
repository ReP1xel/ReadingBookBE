import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectBookDto {
  @ApiProperty({ 
    example: 'Content does not meet community guidelines',
    description: 'Reason for rejecting the book'
  })
  @IsNotEmpty()
  @IsString()
  reason: string;
} 
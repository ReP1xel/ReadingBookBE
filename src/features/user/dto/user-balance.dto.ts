import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class UserBalanceDto {
  @ApiProperty({
    description: 'Current token balance',
    example: 100.50,
  })
  @Expose()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenBalance: number;

  @ApiProperty({
    description: 'Total tokens spent',
    example: 25.75,
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenSpent?: number;

  @ApiProperty({
    description: 'Total tokens received',
    example: 50.25,
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenReceived?: number;

  @ApiProperty({
    description: 'Total tokens purchased',
    example: 100.00,
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenPurchased?: number;

  @ApiProperty({
    description: 'Total tokens withdrawn',
    example: 10.00,
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenWithdrawn?: number;

  @ApiProperty({
    description: 'Total tokens earned',
    example: 75.50,
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  tokenEarned?: number;
} 
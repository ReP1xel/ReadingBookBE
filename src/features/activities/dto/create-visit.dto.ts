import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateVisitDto {
  @IsUUID()
  visitorId: string;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  referrer?: string;
} 
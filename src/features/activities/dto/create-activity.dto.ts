import { IsEnum, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ACTIVITY_TYPE } from '../entities/activity.entity';

export class CreateActivityDto {
  @IsEnum(ACTIVITY_TYPE)
  activityType: ACTIVITY_TYPE;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  maxPerDay?: number;

  @IsBoolean()
  streakBased: boolean;

  @IsNumber()
  basePoint: number;

  @IsOptional()
  @IsNumber()
  maxStreakPoint?: number;
}
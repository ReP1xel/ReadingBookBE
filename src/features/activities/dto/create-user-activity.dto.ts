import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ACTIVITY_TYPE } from '../entities/activity.entity';

export class CreateUserActivityDto {
  @IsEnum(ACTIVITY_TYPE)
  activityType: ACTIVITY_TYPE;

  @IsOptional()
  @IsNumber()
  relatedEntityId?: number;
} 
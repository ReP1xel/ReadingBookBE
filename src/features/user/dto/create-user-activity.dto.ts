import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ACTIVITY_TYPE } from '@features/activities/entities/activity.entity';

export class CreateUserActivityDto {
  @IsEnum(ACTIVITY_TYPE)
  activityType: ACTIVITY_TYPE;

  @IsOptional()
  @IsNumber()
  relatedEntityId?: number;
} 
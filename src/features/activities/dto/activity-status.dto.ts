import { Activity, ACTIVITY_TYPE } from '../entities/activity.entity';
import { Expose, Type } from 'class-transformer';

export enum ActivityStatus {
  DONE = 'done',
  IN_PROGRESS = 'inprogress',
  NOT_STARTED = 'notstarted',
}

export class ActivityDto {
  @Expose()
  id: number;

  @Expose()
  activityType: ACTIVITY_TYPE;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  maxPerDay: number;

  @Expose()
  streakBased: boolean;

  @Expose()
  basePoint: number;

  @Expose()
  maxStreakPoint: number;
}

export class ActivityStatusResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  activityType: ACTIVITY_TYPE;

  @Expose()
  maxPerDay: number;

  @Expose()
  streakBased: boolean;

  @Expose()
  basePoint: number;

  @Expose()
  maxStreakPoint: number;

  @Expose()
  status: ActivityStatus;

  @Expose()
  currentStreak: number;

  @Expose()
  completedCount: number;

  @Expose()
  @Type(() => ActivityDto)
  activity: ActivityDto;
} 
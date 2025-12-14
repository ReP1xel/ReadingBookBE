import { ACTIVITY_TYPE } from '@features/activities/entities/activity.entity';

export enum ActivityStatus {
  DONE = 'done',
  IN_PROGRESS = 'inprogress',
  NOT_STARTED = 'notstarted',
}

export class ActivityStatusResponseDto {
  id: number;
  name: string;
  type: ACTIVITY_TYPE;
  status: ActivityStatus;
  done: number;
  total: number;
  earnedPoint: number;
} 
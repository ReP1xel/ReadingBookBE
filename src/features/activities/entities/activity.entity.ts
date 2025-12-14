import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { UserActivity } from './user-activity.entity';

export enum ACTIVITY_TYPE {
  LOGIN = 'login',
  WATCH_AD = 'watch_ad',
  RATE_BOOK = 'rate_book',
  COMPLETE_BOOK = 'complete_book',
  READ_STREAK = 'read_streak',
  COMMENT_CHAPTER = 'comment_chapter',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Index('idx_activity_type')
  @Column({
    name: 'activity_type',
    type: 'enum',
    enum: ACTIVITY_TYPE,
  })
  activityType: ACTIVITY_TYPE;

  @Column({ name: 'title', type: 'varchar' })
  title: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'max_per_day', type: 'int', nullable: true })
  maxPerDay: number;

  @Column({ name: 'streak_based', type: 'boolean', default: false })
  streakBased: boolean;

  @Column({ name: 'base_point', type: 'int' })
  basePoint: number;

  @Column({ name: 'max_streak_point', type: 'int', default: 7 })
  maxStreakPoint: number;

  @OneToMany(() => UserActivity, (userActivity) => userActivity.activity)
  userActivities: UserActivity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
} 
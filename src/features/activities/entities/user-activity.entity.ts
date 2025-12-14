import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '@features/user/entities/user.entity';
import { Activity, ACTIVITY_TYPE } from './activity.entity';

@Entity('user_activities')
export class UserActivity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Index('idx_user_activity_user')
  @ManyToOne(() => User, (user) => user.activities)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index('idx_user_activity_type')
  @Column({
    name: 'activity_type',
    type: 'enum',
    enum: ACTIVITY_TYPE,
    nullable: false,
  })
  activityType: ACTIVITY_TYPE;

  @Index('idx_user_activity_date')
  @Column({ name: 'activity_date', type: 'date' })
  activityDate: Date;

  @Column({ name: 'related_entity_id', type: 'int', nullable: true })
  relatedEntityId: number;

  @Column({ name: 'current_streak', type: 'int', nullable: true })
  currentStreak: number;

  @Column({ name: 'earned_point', type: 'int' })
  earnedPoint: number;

  @Index('idx_user_activity_activity')
  @ManyToOne(() => Activity, (activity) => activity.userActivities)
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
} 
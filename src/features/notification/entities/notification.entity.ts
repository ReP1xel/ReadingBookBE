import { User } from '@features/user/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  BOOK_UPDATED = 'BOOK_UPDATED',
  BOOK_CHAPTER_ADDED = 'BOOK_CHAPTER_ADDED',
  BOOK_FOLLOWED = 'BOOK_FOLLOWED',
  BOOK_RATING = 'BOOK_RATING',
  COMMENT_REPLY = 'COMMENT_REPLY',
  CHAPTER_COMMENT = 'CHAPTER_COMMENT',
  TX_SUCCESS = 'TX_SUCCESS',
  TX_FAILED = 'TX_FAILED',
  POINTS_EARNED = 'POINTS_EARNED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: number;

  @Index('idx_notification_user')
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'type',
    type: 'varchar',
    length: 40,
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ name: 'title', type: 'varchar', length: 120 })
  title: string;

  @Column({ name: 'message', type: 'text', nullable: true })
  message: string | null;

  @Column({ name: 'data', type: 'jsonb', default: '{}' })
  data: Record<string, any>;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;
}

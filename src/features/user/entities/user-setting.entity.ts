import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@features/user/entities/user.entity';

@Entity('user_settings')
@Index('idx_user_settings_user_id', ['user'])
export class UserSettings {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['light', 'dark', 'system'],
    default: 'system',
  })
  theme: 'light' | 'dark' | 'system';

  @Column({ type: 'enum', enum: ['en', 'vn'], default: 'en' })
  language: 'en' | 'vn';

  @Column({ type: 'int', default: 50 })
  volume: number;

  @Column({
    name: 'reading_mode',
    type: 'enum',
    enum: ['scroll', 'flip'],
    default: 'scroll',
  })
  readingMode: 'scroll' | 'flip';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

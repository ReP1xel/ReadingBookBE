import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PageView } from './page-view.entity';

@Index('idx_visit_visitor_id', ['visitorId'])
@Index('idx_visit_user_id', ['userId'])
@Index('idx_visit_started_at', ['startedAt'])
@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'visitor_id', type: 'uuid' })
  visitorId: string;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date;

  @Column({ name: 'duration', type: 'int', nullable: true })
  duration: number;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'referrer', type: 'varchar', nullable: true })
  referrer: string;

  @OneToMany(() => PageView, (pageView) => pageView.visit)
  pageViews: PageView[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
} 
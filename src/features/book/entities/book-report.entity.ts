import { User } from '@features/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Book } from './book.entity';

@Index('idx_book_report_user', ['user'])
@Index('idx_book_report_book', ['book'])
@Index('idx_book_report_createdAt', ['createdAt'])
@Index('idx_book_report_resolved', ['resolved'])
@Entity('book_report')
export class BookReport {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'reason', type: 'text' })
  reason: string;

  @Column({ name: 'resolved', type: 'boolean', default: false })
  resolved: boolean;

  @ManyToOne(() => User, (user) => user.reports)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, (book) => book.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

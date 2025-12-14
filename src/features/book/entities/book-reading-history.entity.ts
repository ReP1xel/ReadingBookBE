import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '@features/user/entities/user.entity';
import { Book } from './book.entity';
import { BookChapter } from './book-chapter.entity';

@Index('idx_reading_history_user_book_chapter', ['user', 'book', 'chapter'])
@Index('idx_reading_history_created_at', ['createdAt'])
@Entity('book_reading_history')
export class BookReadingHistory {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @ManyToOne(() => User, (user) => user.readingHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, (book) => book.readingHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @ManyToOne(() => BookChapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: BookChapter;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

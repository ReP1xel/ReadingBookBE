import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Book } from './book.entity';
import { User } from '@features/user/entities/user.entity';

@Index('idx_book_follow_user', ['user'])
@Index('idx_book_follow_book', ['book'])
@Index('idx_book_follow_created_at', ['createdAt'])
@Entity('book_follow')
export class BookFollow {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @ManyToOne(() => User, (user) => user.bookFollows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, (book) => book.follows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

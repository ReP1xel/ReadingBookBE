import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Visit } from './visit.entity';
import { BookChapter } from '@features/book/entities/book-chapter.entity';
import { Book } from '@features/book/entities/book.entity';

@Entity('page_views')
export class PageView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_page_view_visit_id')
  @ManyToOne(() => Visit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visit_id' })
  visit: Visit;

  @Column({ name: 'visit_id', type: 'uuid' })
  visitId: string;

  @Index('idx_page_view_chapter_id')
  @ManyToOne(() => BookChapter, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'chapter_id' })
  chapter: BookChapter;

  @Column({ name: 'chapter_id', type: 'int', nullable: true })
  chapterId: number;

  @Index('idx_page_view_book_id')
  @ManyToOne(() => Book, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({ name: 'book_id', type: 'int', nullable: true })
  bookId: number;

  @Column({ name: 'url', type: 'varchar', length: 2048 })
  url: string;

  @CreateDateColumn({ name: 'viewed_at', type: 'timestamptz' })
  viewedAt: Date;
} 
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Book } from './book.entity';
import { BookChapterComment } from './book-chapter-comment.entity';
import { ChapterPurchase } from '@features/transaction/entities/chapter-purchase.entity';

export enum ChapterAccessStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected',
}

@Index('idx_book_chapter_book', ['book'])
@Index('idx_book_chapter_chapter', ['chapter'])
@Index('idx_book_chapter_created_at', ['createdAt'])
@Index('idx_book_chapter_updated_at', ['updatedAt'])
@Entity('book_chapter')
export class BookChapter {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'title', type: 'varchar', length: 500 })
  title: string;

  @Column({ name: 'chapter', type: 'int' })
  chapter: number;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'cover', type: 'varchar', length: 500, nullable: true })
  cover: string;

  @Column({ name: 'is_locked', type: 'boolean', default: false })
  isLocked: boolean;

  @Column({ name: 'price', type: 'decimal', default: 0 })
  price: number;

  @Column({ name: 'moderated', type: 'varchar', nullable: true })
  moderated: string;

  @Column({
    name: 'chapter_access_status',
    type: 'enum',
    enum: ChapterAccessStatus,
    default: ChapterAccessStatus.DRAFT,
  })
  chapterAccessStatus: ChapterAccessStatus;

  @ManyToOne(() => Book, (book) => book.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @OneToMany(() => ChapterPurchase, (purchase) => purchase.chapter)
  purchases: ChapterPurchase[];

  @OneToMany(() => BookChapterComment, (comment) => comment.chapter)
  comments: BookChapterComment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

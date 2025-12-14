import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '@features/user/entities/user.entity';
import { BookChapter } from './book-chapter.entity';
import { BookReview } from './book-review.entity';
import { BookReport } from './book-report.entity';
import { BookCategoryRelation } from './book-category-relation.entity';
import { BookFollow } from './book-follow.entity';
import { BookReadingHistory } from './book-reading-history.entity';
import { BookProgressStatus } from './book-progess-status.entity';
import { BookAccessStatus } from './book-access-status.entity';
import { BookType } from './book-type.entity';

@Index('idx_book_title', ['title'])
@Index('idx_book_views', ['views'])
@Index('idx_book_follow_count', ['followsCount'])
@Index('idx_book_author', ['author'])
@Index('idx_book_access_status', ['accessStatus'])
@Index('idx_book_progress_status', ['progressStatus'])
@Index('idx_book_book_type', ['bookType'])
@Index('idx_book_created_at', ['createdAt'])
@Index('idx_book_updated_at', ['updatedAt'])
@Entity('book')
export class Book {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'title', type: 'varchar', length: 500 })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'cover', type: 'text', nullable: true })
  cover: string;

  @Column({ name: 'age_rating', type: 'int', default: 6 })
  ageRating: number;

  @Column({ name: 'views', type: 'int', default: 0 })
  views: number;

  @Column({ name: 'follows_count', type: 'int', default: 0 })
  followsCount: number;

  @Column({ name: 'moderated', type: 'varchar', nullable: true })
  moderated: string;

  @ManyToOne(() => BookType, (type) => type.books)
  @JoinColumn({ name: 'book_type_id' })
  bookType: BookType;

  @ManyToOne(() => BookAccessStatus, (accessStatus) => accessStatus.books)
  @JoinColumn({ name: 'access_status_id' })
  accessStatus: BookAccessStatus;

  @ManyToOne(() => BookProgressStatus, (progressStatus) => progressStatus.books)
  @JoinColumn({ name: 'progress_status_id' })
  progressStatus: BookProgressStatus;

  @ManyToOne(() => User, (user) => user.books)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @OneToMany(() => BookCategoryRelation, (relation) => relation.book)
  bookCategoryRelations: BookCategoryRelation[];

  @OneToMany(() => BookChapter, (chapter) => chapter.book)
  chapters: BookChapter[];

  @OneToMany(() => BookFollow, (follow) => follow.book)
  follows: BookFollow[];

  @OneToMany(() => BookReadingHistory, (history) => history.book)
  readingHistories: BookReadingHistory[];

  @OneToMany(() => BookReview, (review) => review.book)
  reviews: BookReview[];

  @OneToMany(() => BookReport, (report) => report.book)
  reports: BookReport[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

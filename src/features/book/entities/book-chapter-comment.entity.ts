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
import { BookChapter } from './book-chapter.entity';
import { User } from '@features/user/entities/user.entity';

@Index('idx_book_chapter_comment_user', ['user'])
@Index('idx_book_chapter_comment_chapter', ['chapter'])
@Index('idx_book_chapter_comment_created_at', ['createdAt'])
@Index('idx_book_chapter_comment_parent', ['parent'])
@Entity('book_chapter_comment')
export class BookChapterComment {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @ManyToOne(() => BookChapter, (chapter) => chapter.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id' })
  chapter: BookChapter;

  @ManyToOne(() => User, (user) => user.chapterComments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'comment', type: 'text' })
  comment: string;

  @ManyToOne(() => BookChapterComment, (comment) => comment.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: BookChapterComment;

  @OneToMany(() => BookChapterComment, (comment) => comment.parent)
  children?: BookChapterComment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

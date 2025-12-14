import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '@features/user/entities/user.entity';
import { BookChapter } from '@features/book/entities/book-chapter.entity';

@Entity('chapter_purchases')
export class ChapterPurchase {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Index('idx_purchase_user')
  @ManyToOne(() => User, (user) => user.chapterPurchases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index('idx_purchase_chapter')
  @ManyToOne(() => BookChapter, (chapter) => chapter.purchases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id' })
  chapter: BookChapter;

  @Column({ type: 'int' })
  price: number;
  @Index('idx_chapter_purchases_created_at')
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Index('idx_chapter_purchases_updated_at')
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

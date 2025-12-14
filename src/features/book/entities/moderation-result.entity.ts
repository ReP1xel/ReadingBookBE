import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Book } from './book.entity';

@Entity('moderation_result')
export class ModerationResult {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({ type: 'jsonb', nullable: true })
  title: string;

  @Column({ type: 'jsonb', nullable: true })
  description: string;

  @Column({ name: 'cover_image', type: 'jsonb', nullable: true })
  coverImage: string;

  @Column({ type: 'jsonb', nullable: true })
  chapters: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
} 
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Book } from './book.entity';

@Index('idx_book_progress_status_name', ['name'])
@Entity('book_progress_status')
export class BookProgressStatus {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Book, (book) => book.progressStatus)
  books: Book[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

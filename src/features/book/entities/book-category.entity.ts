import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BookCategoryRelation } from './book-category-relation.entity';

@Index('idx_book_category_name', ['name'])
@Entity('book_category')
export class BookCategory {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 500 })
  name: string;

  @OneToMany(() => BookCategoryRelation, (relation) => relation.category)
  bookCategoryRelations: BookCategoryRelation[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

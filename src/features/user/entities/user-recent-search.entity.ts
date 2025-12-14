import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum SearchType {
  BOOK = 'book',
  AUTHOR = 'author',
}

@Entity('user_recent_searches')
export class UserRecentSearch {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: SearchType,
    default: SearchType.BOOK,
  })
  searchType: SearchType;

  @Column({ type: 'varchar', length: 255 })
  searchValue: string;

  @Column({ name: 'related_id', type: 'int', nullable: true })
  relatedId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
} 
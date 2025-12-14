import * as bcrypt from 'bcrypt';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Role } from './role.entity';
import { UserStatus } from './user-status.entity';
import { Book } from '@features/book/entities/book.entity';
import { BookReview } from '@features/book/entities/book-review.entity';
import { BookReport } from '@features/book/entities/book-report.entity';
import { UserReport } from './user-report.entity';
import { BookFollow } from '@features/book/entities/book-follow.entity';
import { BookReadingHistory } from '@features/book/entities/book-reading-history.entity';
import { BookChapterComment } from '@features/book/entities/book-chapter-comment.entity';
import { Notification } from '@features/notification/entities/notification.entity';
import { ChapterPurchase } from '@features/transaction/entities/chapter-purchase.entity';
import { Transaction } from '@features/transaction/entities/transaction.entity';
import { UserFavorite } from './user-favorite.entity';
import { UserActivity } from '@features/activities/entities/user-activity.entity';

export enum GENDER_ENUM {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Index('idx_user_email')
  @Column({ name: 'email', type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'password', type: 'varchar' })
  password: string;

  @Index('idx_user_name')
  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Index('idx_user_gender')
  @Column({
    name: 'gender',
    type: 'enum',
    enum: GENDER_ENUM,
    default: GENDER_ENUM.OTHER,
  })
  gender: GENDER_ENUM;

  @Column({ name: 'avatar', type: 'varchar', nullable: true })
  avatar: string;

  @Index('idx_user_birth_date')
  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'facebook_link', type: 'varchar', nullable: true })
  facebook: string;

  @Column({ name: 'twitter', type: 'varchar', nullable: true })
  twitter: string;

  @Column({ name: 'instagram', type: 'varchar', nullable: true })
  instagram: string;

  @Column({ name: 'is_vip', type: 'boolean', default: false })
  isVip: boolean;

  @Index('idx_user_role')
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Index('idx_user_status')
  @ManyToOne(() => UserStatus, (status) => status.users)
  @JoinColumn({ name: 'status_id' })
  status: UserStatus;

  @Index('idx_user_token_balance')
  @Column({ name: 'token_balance', type: 'decimal', default: 0 })
  tokenBalance: number;

  @Index('idx_user_token_spent')
  @Column({ name: 'token_spent', type: 'decimal', default: 0 })
  tokenSpent: number;

  @Index('idx_user_token_received')
  @Column({ name: 'token_received', type: 'decimal', default: 0 })
  tokenReceived: number;

  @Index('idx_user_token_purchased')
  @Column({ name: 'token_purchased', type: 'decimal', default: 0 })
  tokenPurchased: number;

  @Index('idx_user_token_withdrawn')
  @Column({ name: 'token_withdrawn', type: 'decimal', default: 0 })
  tokenWithdrawn: number;

  @Index('idx_user_token_earned')
  @Column({ name: 'token_earned', type: 'decimal', default: 0 })
  tokenEarned: number;

  @OneToMany(() => Book, (book) => book.author)
  books: Book[];

  @OneToMany(() => BookFollow, (follow) => follow.user)
  bookFollows: BookFollow[];

  @OneToMany(() => BookChapterComment, (comment) => comment.user)
  chapterComments: BookChapterComment[];

  @OneToMany(() => BookReadingHistory, (history) => history.user)
  readingHistories: BookReadingHistory[];

  @OneToMany(() => BookReview, (review) => review.user)
  reviews: BookReview[];

  @OneToMany(() => BookReport, (report) => report.user)
  reports: BookReport[];

  @OneToMany(() => UserReport, (report) => report.reportedUser)
  reportedBy: UserReport[];

  @OneToMany(() => UserReport, (report) => report.reporter)
  reportsMade: UserReport[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => ChapterPurchase, (purchase) => purchase.user)
  chapterPurchases: ChapterPurchase[];

  @OneToMany(() => UserFavorite, (favorite) => favorite.user)
  favorites: UserFavorite[];

  @OneToMany(() => UserActivity, (activity) => activity.user)
  activities: UserActivity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}

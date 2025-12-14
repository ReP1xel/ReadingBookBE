import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '@features/user/entities/user.entity';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryColumn({ name: 'id', type: 'text' })
  id: string;

  @Column({ name: 'amount', type: 'decimal' })
  amount: number;

  @Column({ name: 'tokens', type: 'int' })
  tokens: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Index('idx_transaction_user')
  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index('idx_transaction_created_at')
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Index('idx_transaction_updated_at')
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChapterPurchase } from './entities/chapter-purchase.entity';
import { Transaction } from './entities/transaction.entity';
import { LoggerService } from '@core/logger/logger.service';
import { User } from '@features/user/entities/user.entity';
import { BookChapter } from '@features/book/entities/book-chapter.entity';
import { NotificationGatewayModule } from '@core/gateway/notification.module';
import { NotificationModule } from '@features/notification/notification.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, BookChapter, ChapterPurchase, Transaction]),
    NotificationGatewayModule,
    NotificationModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService, LoggerService],
})
export class TransactionModule {}

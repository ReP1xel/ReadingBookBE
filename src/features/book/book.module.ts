import { forwardRef, Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { BookCategory } from './entities/book-category.entity';
import { BookChapter } from './entities/book-chapter.entity';
import { BookReport } from './entities/book-report.entity';
import { BookReview } from './entities/book-review.entity';
import { UserModule } from '@features/user/user.module';
import { BookCategoryRelation } from './entities/book-category-relation.entity';
import { BookAccessStatus } from './entities/book-access-status.entity';
import { BookFollow } from './entities/book-follow.entity';
import { BookProgressStatus } from './entities/book-progess-status.entity';
import { BookReadingHistory } from './entities/book-reading-history.entity';
import { BookChapterComment } from './entities/book-chapter-comment.entity';
import { BookType } from './entities/book-type.entity';
import { NotificationGatewayModule } from '@core/gateway/notification.module';
import { NotificationModule } from '@features/notification/notification.module';
import { ChapterPurchase } from '@features/transaction/entities/chapter-purchase.entity';
import { UserFavorite } from '@features/user/entities/user-favorite.entity';
import { LoggerModule } from '@core/logger/logger.module';
import { ModerationResult } from './entities/moderation-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookAccessStatus,
      BookCategoryRelation,
      BookCategory,
      BookChapter,
      BookFollow,
      BookType,
      BookProgressStatus,
      BookReadingHistory,
      BookReport,
      BookReview,
      Book,
      BookChapterComment,
      ChapterPurchase,
      UserFavorite,
      ModerationResult,
    ]),
    LoggerModule,
    forwardRef(() => UserModule),
    NotificationGatewayModule,
    NotificationModule,
  ],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}

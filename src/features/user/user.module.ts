import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { UserReport } from './entities/user-report.entity';
import { Role } from './entities/role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookModule } from '@features/book/book.module';
import { UserStatus } from './entities/user-status.entity';
import { LoggerModule } from '@core/logger/logger.module';
import { UserFavorite } from './entities/user-favorite.entity';
import { BookCategory } from '@features/book/entities/book-category.entity';
import { UserSettings } from './entities/user-setting.entity';
import { Book } from '@features/book/entities/book.entity';
import { BookReadingHistory } from '@features/book/entities/book-reading-history.entity';
import { UserRecentSearch } from './entities/user-recent-search.entity';
import { Activity } from '@features/activities/entities/activity.entity';
import { UserActivity } from '@features/activities/entities/user-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserReport,
      UserStatus,
      Role,
      UserFavorite,
      Book,
      BookReadingHistory,
      BookCategory,
      UserSettings,
      UserRecentSearch,
      Activity,
      UserActivity,
    ]),
    forwardRef(() => BookModule),
    JwtModule,
    LoggerModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

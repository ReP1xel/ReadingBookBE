import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '@features/user/entities/user.entity';
import { LoggerModule } from '@core/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    LoggerModule
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

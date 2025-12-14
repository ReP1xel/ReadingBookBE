import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Activity } from './entities/activity.entity';
import { UserActivity } from './entities/user-activity.entity';
import { User } from '@features/user/entities/user.entity';
import { Visit } from './entities/visit.entity';
import { PageView } from './entities/page-view.entity';
import { TrackerLogin } from './entities/tracker-login.entity';
import { NotificationGatewayModule } from '@core/gateway/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      UserActivity,
      User,
      Visit,
      PageView,
      TrackerLogin,
    ]),
    NotificationGatewayModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {} 
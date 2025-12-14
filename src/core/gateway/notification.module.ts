import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { NotificationModule } from '@features/notification/notification.module';
import { UserModule } from '@features/user/user.module';
@Module({
  imports: [NotificationModule, UserModule],
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class NotificationGatewayModule {} 
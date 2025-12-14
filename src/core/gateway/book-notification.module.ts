import { Module } from '@nestjs/common';
import { BookNotificationGateway } from './book-notification.gateway';

@Module({
  providers: [BookNotificationGateway],
  exports: [BookNotificationGateway],
})
export class BookNotificationModule {}

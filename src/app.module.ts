import { AuthModule } from '@core/auth/auth.module';
import { CacheModule } from '@core/cache/cache.module';
import { CloudinaryModule } from '@core/cloudinary/cloudinary.module';
import { BookNotificationModule } from '@core/gateway/book-notification.module';
import { DatabaseModule } from '@database/database.module';
import { BookModule } from '@features/book/book.module';
import { TransactionModule } from '@features/transaction/transaction.module';
import { UserModule } from '@features/user/user.module';
import { ActivitiesModule } from '@features/activities/activities.module';
import { RateLimitMiddleware } from '@middleware/rate-limit.middleware';
import { MailerModule } from '@nestjs-modules/mailer';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationModule } from './features/notification/notification.module';
import { OpenAiModule } from './openai/openai.module';
import { ChatModule } from './chat/chat.module';


@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    CacheModule,
    AuthModule,
    ChatModule,
    UserModule,
    BookModule,
    TransactionModule,
    CloudinaryModule,
    BookNotificationModule,
    ActivitiesModule,
    NotificationModule,
    OpenAiModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(LoggerMiddleware, RateLimitMiddleware).forRoutes('*');
  }
}

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@features/user/entities/user.entity';
import { LoggerModule } from '@core/logger/logger.module';
import { jwtConfig } from '@core/config/global';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      secret: jwtConfig.secret || 'your_secret_key',
      signOptions: { expiresIn: jwtConfig.expiresIn || '8h' },
    }),
    TypeOrmModule.forFeature([User]),
    LoggerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

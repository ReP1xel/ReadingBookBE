import { jwtConfig } from '@core/config/global';
import { LoggerService } from '@core/logger/logger.service';
import { UserResponseDto } from '@features/user/dto/get-user-response.dto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayloadDto } from '@shared/dto/jwt/jwt.dto';
import { plainToInstance } from 'class-transformer';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly loggerService: LoggerService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret || 'your_secret_key',
    });
  }

  async validate(payload: JwtPayloadDto): Promise<UserResponseDto> {
    try {
      switch (payload.status.id) {
        case 2:
          throw new ForbiddenException(
            'Your account has not been verified yet',
          );
        case 3:
          throw new ForbiddenException('Your account is currently locked');
        default:
          break;
      }

      return plainToInstance(UserResponseDto, payload, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'JwtStrategy.validate');
      throw error;
    }
  }
}

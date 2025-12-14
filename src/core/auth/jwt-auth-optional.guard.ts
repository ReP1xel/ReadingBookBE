import { LoggerService } from '@core/logger/logger.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly loggerService: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers['authorization'];

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = await this.jwtService.verifyAsync(token);

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

        request.user = payload;
      }

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'OptionalAuthGuard.canActivate');
      throw error;
    }
  }
}

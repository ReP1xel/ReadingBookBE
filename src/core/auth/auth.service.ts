import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '@features/user/entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserResponseDto } from '@features/user/dto/get-user-response.dto';
import { DatabaseService } from '@core/database/database.service';
import { LoginDto, LoginResponseDto } from '@features/user/dto/login.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { LoggerService } from '@core/logger/logger.service';
import { jwtConfig } from '@core/config/global';

@Injectable()
export class AuthService {
  private readonly jwtSecret = jwtConfig.secret;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly dataBaseService: DatabaseService,
    private readonly loggerService: LoggerService,
  ) {}

  async login(body: LoginDto): Promise<LoginResponseDto> {
    try {
      const { email, password } = body;

      const user: User | null = await this.dataBaseService.findOne<User>(
        this.userRepository,
        {
          where: { email },
          relations: ['role', 'status'],
        },
      );
      if (!user) {
        throw new BadRequestException('Người dùng không tồn tại');
      }

      if (user.status.id === 2) {
        throw new BadRequestException('Tài khoản của bạn chưa được xác thực');
      }

      if (user.status.id === 3) {
        throw new BadRequestException('Your account has been banned.');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Mật khẩu không đúng');
      }

      const payload = plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      });

      const expiresInSeconds = 60 * 60 * 8;
      const issuedAt = Math.floor(Date.now() / 1000);
      const expirationTime = issuedAt + expiresInSeconds;

      const accessToken = await this.jwtService.signAsync(
        instanceToPlain(payload),
        { secret: this.jwtSecret },
      );

      this.loggerService.info('User logged in', 'AuthService.login');

      return { accessToken, expiresIn: expirationTime, user: payload };
    } catch (error) {
      this.loggerService.err(error.message, 'AuthService.login');

      throw error;
    }
  }
}

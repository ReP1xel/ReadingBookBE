import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateManagerDto, CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { In, IsNull, MoreThan, Not, Repository, Between } from 'typeorm';
import { DatabaseService } from '@core/database/database.service';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
  GetUsersFilterDto,
  UserProfileResponseDto,
  UserPublicDto,
  UserResponseDto,
} from './dto/get-user-response.dto';
import { jwtConfig, userConfig } from '@core/config/global';
import { LoggerService } from '@core/logger/logger.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CacheService } from '@core/cache/cache.service';
import { VerifyResetPasswordDto } from './dto/verify-reset-password-dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password-dto';
import { JwtService } from '@nestjs/jwt';
import { PaginationRequestDto } from '@shared/dto/common/pagnination/pagination-request.dto';
import { PaginationResponseDto } from '@shared/dto/common/pagnination/pagination-response.dto';
import { UserFavorite } from './entities/user-favorite.entity';
import { BookCategory } from '@features/book/entities/book-category.entity';
import { UserSettings } from './entities/user-setting.entity';
import { UpdateSettingsDto, UserSettingsDto } from './dto/user-setting.dto';
import { Book } from '@features/book/entities/book.entity';
import { UserProfileDto } from './dto/user-profile.dto';
import { BookReadingHistory } from '@features/book/entities/book-reading-history.entity';
import { LoginResponseDto } from './dto/login.dto';
import { UserRecentSearch, SearchType } from './entities/user-recent-search.entity';
import { RecentSearchResponseDto } from './dto/recent-search-response.dto';
import { Activity, ACTIVITY_TYPE } from '@features/activities/entities/activity.entity';
import { UserActivity } from '@features/activities/entities/user-activity.entity';
import { ActivityStatus, ActivityStatusResponseDto } from './dto/activity-status.dto';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { TimePeriod } from '@features/activities/dto/time-range.dto';
import { UserBalanceDto } from './dto/user-balance.dto';

@Injectable()
export class UserService {
  private readonly roleUserId = userConfig.roleUserId;
  private readonly statusUserId = userConfig.statusUserId;
  private readonly redisTtlResetPassword = userConfig.redisTtlResetPassword;
  private readonly jwtSecret = jwtConfig.secret;
  private readonly jwtExpiresInVerify = jwtConfig.expiresInVerify;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepository: Repository<UserFavorite>,
    @InjectRepository(BookCategory)
    private readonly bookCategoryRepository: Repository<BookCategory>,
    @InjectRepository(BookReadingHistory)
    private readonly bookReadingHistoryRepository: Repository<BookReadingHistory>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>,
    @InjectRepository(UserRecentSearch)
    private readonly userRecentSearchRepository: Repository<UserRecentSearch>,
    private readonly dataBaseService: DatabaseService,
    private readonly mailerService: MailerService,
    private readonly loggerService: LoggerService,
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
  ) {}

  private generateOTP(): string {
    return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join(
      '',
    );
  }

  private async renderTemplate(
    templateName: string,
    variables: Record<string, any>,
  ): Promise<string> {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'shared',
        'templates',
        `${templateName}.hbs`,
      );

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = Handlebars.compile(templateContent);

      return compiledTemplate(variables);
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.resetPassword');
      throw error;
    }
  }

  async register(body: CreateUserDto): Promise<UserResponseDto> {
    try {
      const {
        email,
        password,
        name,
        gender,
        avatar,
        birthDate,
        bio,
        facebook,
        instagram,
        twitter,
      } = body;

      const emailExists = await this.dataBaseService.findOne<User>(
        this.userRepository,
        { where: { email } },
      );

      if (emailExists) {
        throw new BadRequestException('Email đã được sử dụng');
      }

      const newUser: User = await this.dataBaseService.create<User>(
        this.userRepository,
        {
          email,
          password,
          name,
          gender,
          avatar,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          bio,
          facebook,
          instagram,
          twitter,
          role: { id: this.roleUserId },
          status: { id: this.statusUserId },
        },
      );

      this.loggerService.info('User created', 'UserService.register');

      const verificationPayload = { id: newUser.id };
      const verificationToken = await this.jwtService.signAsync(
        verificationPayload,
        {
          secret: this.jwtSecret,
          expiresIn: this.jwtExpiresInVerify,
        },
      );

      await this.cacheService.set(
        `verify:${newUser.id}`,
        verificationToken,
        this.redisTtlResetPassword,
      );

      const verificationUrl = `http://localhost:3001/verify-email?token=${verificationToken}&&email=${email}`;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Xác thực tài khoản của bạn',
        text: `Vui lòng xác thực tài khoản của bạn bằng cách truy cập đường dẫn sau: ${verificationUrl}. Link chỉ có hiệu lực trong 5 phút.`,
        html: `<h3>Xin chào ${name},</h3>
               <p>Vui lòng <a href="${verificationUrl}">click vào đây</a> để xác thực tài khoản của bạn. Lưu ý: Link chỉ có hiệu lực trong 5 phút.</p>`,
      });

      this.loggerService.info(
        'Verification email sent',
        'UserService.register',
      );

      return plainToInstance(UserResponseDto, newUser);
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.register');
      throw error;
    }
  }

  async verify(token: string): Promise<LoginResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtSecret,
      });

      const storedToken = await this.cacheService.get(`verify:${payload.id}`);
      if (!storedToken || storedToken !== token) {
        throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
      }

      const user = await this.dataBaseService.findOne<User>(
        this.userRepository,
        {
          where: { id: payload.id },
        },
      );
      if (!user) {
        throw new BadRequestException('Người dùng không tồn tại');
      }

      await this.dataBaseService.update<User>(this.userRepository, user.id, {
        status: { id: 1 },
        tokenBalance: Number(user.tokenBalance || 0) + 50,
        tokenReceived: Number(user.tokenEarned || 0) + 50,
      });

      const newUser = await this.dataBaseService.findOne<User>(
        this.userRepository,
        {
          where: { id: user.id },
          relations: ['role', 'status'],
        },
      );

      const payloadAccessToken = plainToInstance(UserResponseDto, newUser, {
        excludeExtraneousValues: true,
      });

      const expiresInSeconds = 60 * 60 * 8;
      const issuedAt = Math.floor(Date.now() / 1000);
      const expirationTime = issuedAt + expiresInSeconds;

      const accessToken = await this.jwtService.signAsync(
        instanceToPlain(payloadAccessToken),
        { secret: this.jwtSecret },
      );

      user.tokenBalance = Number(user.tokenBalance || 0) + 50;
      user.tokenReceived = Number(user.tokenReceived || 0) + 50;

      const userDto = plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      });

      await this.cacheService.delete(`verify:${user.id}`);

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Chào mừng bạn tham gia!',
        text: `Xin chào ${user.name}, chào mừng bạn đến với ứng dụng của chúng tôi!`,
        html: `<h3>Xin chào ${user.name},</h3>
               <p>Chào mừng bạn đến với ứng dụng của chúng tôi!</p>`,
      });

      this.loggerService.info('Welcome email sent', 'UserService.verify');

      return {
        accessToken,
        expiresIn: expirationTime,
        user: userDto,
      };
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.verify');
      throw error;
    }
  }

  async resetPassword(body: ResetPasswordDto): Promise<Boolean> {
    try {
      const otp = this.generateOTP();
      const emailContent = await this.renderTemplate('reset-password', {
        token: otp,
      });
      const email = body.email;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Mã OTP đặt lại mật khẩu',
        html: emailContent,
      });

      this.loggerService.info('OTP sent', 'UserService.resetPassword');

      const cachedKey = `reset-password:${email}`;

      await this.cacheService.set(cachedKey, otp, this.redisTtlResetPassword);

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.resetPassword');
      throw error;
    }
  }

  async verifyResetPasswordCode(
    body: VerifyResetPasswordDto,
  ): Promise<boolean> {
    try {
      const email = body.email;
      const cachedKey = `reset-password:${email}`;
      const failCountKey = `reset-password:fail-count:${email}`;
      const storedOtp = await this.cacheService.get(cachedKey);

      if (!storedOtp) {
        throw new BadRequestException('Mã code không tồn tại hoặc đã hết hạn.');
      }

      const failCount = Number(await this.cacheService.get(failCountKey)) ?? 0;

      if (storedOtp !== body.otp) {
        const newFailCount = failCount + 1;

        if (newFailCount >= 3) {
          await this.cacheService.delete(cachedKey);
          await this.cacheService.delete(failCountKey);
          throw new BadRequestException('Bạn đã nhập sai quá số lần cho phép.');
        }

        await this.cacheService.set(
          failCountKey,
          newFailCount.toString(),
          this.redisTtlResetPassword,
        );
        throw new BadRequestException('Mã OTP không đúng.');
      }

      await this.cacheService.delete(cachedKey);
      await this.cacheService.delete(failCountKey);

      const newPassword = generatePassword(8);

      const user = await this.dataBaseService.findOne<User>(
        this.userRepository,
        { where: { email } },
      );
      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      await this.dataBaseService.update<User>(this.userRepository, user.id, {
        password: await bcrypt.hash(newPassword, 10),
      });

      await this.mailerService.sendMail({
        to: email,
        subject: 'Mật khẩu mới của bạn',
        text: `Mật khẩu mới của bạn là: ${newPassword}. Vui lòng đăng nhập và thay đổi mật khẩu sau khi đăng nhập.`,
        html: `<p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
               <p>Vui lòng đăng nhập và thay đổi mật khẩu sau khi đăng nhập.</p>`,
      });

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.resetPassword');
      throw error;
    }
  }

  async getProfile(req: Request): Promise<UserProfileResponseDto> {
    try {
      const id = (req as any).user?.id;

      const infoUser: User | null = await this.dataBaseService.findOne<User>(
        this.userRepository,
        { relations: ['role', 'status'], where: { id } },
      );

      if (!infoUser) throw new NotFoundException('User not found');

      const booksRead = await this.bookReadingHistoryRepository
        .createQueryBuilder('readingHistory')
        .select('DISTINCT readingHistory.book')
        .where('readingHistory.user = :userId', { userId: id })
        .getCount();

      const chaptersRead = await this.bookReadingHistoryRepository
        .createQueryBuilder('readingHistory')
        .select('DISTINCT readingHistory.chapter')
        .where('readingHistory.user = :userId', { userId: id })
        .getCount();

      const userSettings = await this.userSettingsRepository.findOne({
        where: { user: { id } },
      });

      const user = plainToInstance(UserProfileResponseDto, infoUser, {
        excludeExtraneousValues: true,
      });
      const preferences = plainToInstance(UserSettingsDto, userSettings, {
        excludeExtraneousValues: true,
      });

      user.readingStats = {
        booksRead,
        chaptersRead,
      };
      user.preferences = preferences;

      return user;
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.getProfile');
      throw error;
    }
  }

  async updateUser(
    req: Request,
    body: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new BadRequestException('Không thể xác thực người dùng');
      }

      const user: User | null = await this.dataBaseService.findOne<User>(
        this.userRepository,
        {
          where: { id: userId },
          relations: ['role', 'status'],
        },
      );

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      if (body.name) user.name = body.name;
      if (body.avatar) user.avatar = body.avatar;
      if (body.birthDate) user.birthDate = new Date(body.birthDate);
      if (body.bio) user.bio = body.bio;
      if (body.facebook) user.facebook = body.facebook;
      if (body.twitter) user.twitter = body.twitter;
      if (body.instagram) user.instagram = body.instagram;
      if (body.gender) user.gender = body.gender;
      
      if (body.preferences) {
        // Get the user settings
        const userSettings = await this.userSettingsRepository.findOne({
          where: { user: { id: userId } },
        });

        if (!userSettings) {
          throw new NotFoundException('User settings not found');
        }

        // Update the user settings
        if (body.preferences.language) userSettings.language = body.preferences.language;
        if (body.preferences.theme) userSettings.theme = body.preferences.theme;
        if (body.preferences.volume) userSettings.volume = body.preferences.volume;
        if (body.preferences.readingMode) userSettings.readingMode = body.preferences.readingMode;

        await this.userSettingsRepository.save(userSettings);
      }

      await this.dataBaseService.update<User>(
        this.userRepository,
        userId,
        user,
      );

      this.loggerService.info('User updated', 'UserService.updateUser');

      return plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.updateUser');
      throw error;
    }
  }

  async updatePassword(
    req: Request,
    body: UpdatePasswordDto,
  ): Promise<Boolean> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new BadRequestException('Không thể xác thực người dùng');
      }

      const user = await this.dataBaseService.findOne(this.userRepository, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      const isMatch = await bcrypt.compare(body.oldPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('Mật khẩu cũ không đúng');
      }

      await this.dataBaseService.update<User>(this.userRepository, userId, {
        password: await bcrypt.hash(body.newPassword, 10),
      });

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.updatePassword');
      throw error;
    }
  }

  async getUsers(
    user: UserResponseDto,
    filter: GetUsersFilterDto,
    pagination: PaginationRequestDto,
  ): Promise<PaginationResponseDto<UserResponseDto>> {
    try {
      const userInfo = user;
      const { limit = 10, page = 1 } = pagination;
      const { id, email, name, status, role } = filter;

      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.status', 'status')
        .orderBy('user.id', 'ASC');

      if (userInfo && userInfo?.role?.id !== 1) {
        query.andWhere('role.id != :adminRoleId', { adminRoleId: 1 });
      }

      if (id) {
        query.andWhere('user.id = :id', { id });
      }

      if (email) {
        query.andWhere('user.email ILIKE :email', { email: `%${email}%` });
      }

      if (name) {
        query.andWhere('user.name ILIKE :name', { name: `%${name}%` });
      }

      if (status) {
        query.andWhere('status.id = :status', { status });
      }

      if (role) {
        query.andWhere('role.id = :role', { role });
      }

      const [data, totalItems] = await query
        .take(limit)
        .skip((page - 1) * limit)
        .getManyAndCount();

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: plainToInstance(UserResponseDto, data, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.getUsers');
      throw error;
    }
  }

  async searchUsersByName(search: string, params: { page: number, limit: number }, userId?: number): Promise<PaginationResponseDto<UserPublicDto>> {
    try {
      const { page = 1, limit = 10 } = params;
      if (!search) return {
        totalItems: 0,
        totalPages: 0,
        data: [],
      };

      const users = await this.userRepository
        .createQueryBuilder('user')
        .where(`unaccent(lower(user.name)) LIKE unaccent(lower(:search))`, {
          search: `%${search}%`,
        })
        // .andWhere('user.status_id = :statusId', { statusId: 1 })
        // .andWhere('user.role_id = :roleId', { roleId: 3 })
        .take(limit)
        .skip((page - 1) * limit)
        .getMany();

      // Remove automatic search storing
      
      return {
        totalItems: users.length,
        totalPages: Math.ceil(users.length / limit),
        data: plainToInstance(UserPublicDto, users, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.searchUsersByName');
      throw error;
    }
  }

  async createManagerAccount(createDto: CreateManagerDto): Promise<User> {
    try {
      const { email, password, name } = createDto;

      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new BadRequestException('Email đã được sử dụng');
      }

      const newUser = this.userRepository.create({
        email,
        password,
        name,
        role: { id: 2 },
        status: { id: 1 },
      });

      return this.userRepository.save(newUser);
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.createManagerAccount');
      throw error;
    }
  }

  async updateUserStatus(userId: number, statusId: number): Promise<Boolean> {
    try {
      const user = await this.dataBaseService.findOne(this.userRepository, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.dataBaseService.update(this.userRepository, userId, {
        status: { id: statusId },
      });

      this.loggerService.info(
        `Updated status of user ${userId} to statusId ${statusId}`,
        'UserService.updateUserStatus',
      );

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.updateUserStatus');
      throw error;
    }
  }

  async addFavorite(body) {
    try {
      const { userId, categoryIds } = body;

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      if (!categoryIds || categoryIds.length === 0) return true;

      const categories = await this.bookCategoryRepository.find({
        where: { id: In(categoryIds) },
      });

      if (!categories.length) {
        throw new NotFoundException('No valid categories found');
      }

      const categoryIdsFound = categories.map((c) => c.id);
      const existingFavorites = await this.userFavoriteRepository.find({
        where: {
          user: { id: userId },
          category: { id: In(categoryIdsFound) },
        },
        relations: ['category'],
      });

      const existingCategoryIds = new Set(
        existingFavorites.map((fav) => fav.category.id),
      );

      const newFavorites = categories
        .filter((category) => !existingCategoryIds.has(category.id))
        .map((category) =>
          this.userFavoriteRepository.create({ user, category }),
        );

      if (newFavorites.length > 0) {
        await this.userFavoriteRepository.save(newFavorites);
      }

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.addFavorite');
      throw error;
    }
  }

  async updateFavorite(
    userId: number,
    categoryIds: number[],
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const currentFavorites = await this.userFavoriteRepository.find({
        where: { user: { id: userId } },
        relations: ['category'],
      });

      if (!categoryIds || categoryIds.length === 0) {
        if (currentFavorites.length > 0) {
          await this.userFavoriteRepository.remove(currentFavorites);
        }
        return true;
      }

      const categoriesToRemove = currentFavorites.filter(
        (fav) => !categoryIds.includes(fav.category.id),
      );
      if (categoriesToRemove.length > 0) {
        await this.userFavoriteRepository.remove(categoriesToRemove);
      }

      const categoriesToAdd = categoryIds.filter(
        (categoryId) =>
          !currentFavorites.some((fav) => fav.category.id === categoryId),
      );

      const favoriteEntries: UserFavorite[] = [];

      for (const categoryId of categoriesToAdd) {
        const category = await this.bookCategoryRepository.findOne({
          where: { id: categoryId },
        });

        if (category) {
          const userFavorite = this.userFavoriteRepository.create({
            user,
            category,
          });
          favoriteEntries.push(userFavorite);
        }
      }

      if (favoriteEntries.length > 0) {
        await this.userFavoriteRepository.save(favoriteEntries);
      }

      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.updateFavorite');
      throw error;
    }
  }

  async getFavoriteCategories(userId: number) {
    try {
      const favorites = await this.userFavoriteRepository.find({
        where: { user: { id: userId } },
        relations: ['category'],
      });

      return favorites.map((fav) => fav.category);
    } catch (error) {
      this.loggerService.err(
        error.message,
        'UserService.getFavoriteCategories',
      );
      throw error;
    }
  }

  async getSettings(userId: number): Promise<UserSettings> {
    try {
      let settings = await this.userSettingsRepository.findOne({
        where: { user: { id: userId } },
      });

      if (!settings) {
        settings = this.userSettingsRepository.create({
          user: { id: userId },
        });
        await this.userSettingsRepository.save(settings);
      }

      return settings;
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.getSettings');
      throw error;
    }
  }

  async updateSettings(
    userId: number,
    updateSettingsDto: UpdateSettingsDto,
  ): Promise<UserSettings> {
    try {
      let settings = await this.userSettingsRepository.findOne({
        where: { user: { id: userId } },
      });

      if (!settings) {
        settings = this.userSettingsRepository.create({
          user: { id: userId },
          ...updateSettingsDto,
        });
      } else {
        settings = Object.assign(settings, updateSettingsDto);
      }

      return this.userSettingsRepository.save(settings);
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.updateSettings');
      throw error;
    }
  }

  async getBalance(userId: number): Promise<UserBalanceDto> {
    try {
      const user = await this.dataBaseService.findOne<User>(
        this.userRepository,
        {
          where: { id: userId },
          select: [
            'tokenBalance',
            'tokenSpent',
            'tokenReceived',
            'tokenPurchased',
            'tokenWithdrawn',
            'tokenEarned',
          ],
        },
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return plainToInstance(UserBalanceDto, user, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.getBalance');
      throw error;
    }
  }

  async getUserProfileById(
    id: number,
    userId: number,
  ): Promise<UserProfileDto | UserProfileResponseDto> {
    try {
      const currentUserId = userId;
      const isCurrentUser = id === currentUserId;

      if (isCurrentUser) {
        const infoUser: User | null = await this.dataBaseService.findOne<User>(
          this.userRepository,
          { relations: ['role', 'status'], where: { id } },
        );

        if (!infoUser) throw new NotFoundException('User not found');

        const booksRead = await this.bookReadingHistoryRepository
          .createQueryBuilder('readingHistory')
          .select('DISTINCT readingHistory.book')
          .where('readingHistory.user = :id', { id })
          .getCount();

        const chaptersRead = await this.bookReadingHistoryRepository
          .createQueryBuilder('readingHistory')
          .select('DISTINCT readingHistory.chapter')
          .where('readingHistory.user = :id', { id })
          .getCount();

        const books = await this.bookRepository.find({
          where: { author: { id }, accessStatus: { id: 1 } },
          select: ['id', 'title', 'description', 'cover', 'createdAt'],
          order: { createdAt: 'DESC' },
        });

        const userProfile = plainToInstance(UserProfileResponseDto, infoUser, {
          excludeExtraneousValues: true,
        });

        userProfile.readingStats = {
          booksRead,
          chaptersRead,
        };
        userProfile.books = books.map((book) => ({
          id: book.id,
          title: book.title,
          description: book.description,
          cover: book.cover,
          createdAt: book.createdAt,
        }));

        return userProfile;
      }

      const user = await this.userRepository.findOne({
        where: { id },
        select: ['name', 'avatar', 'bio', 'facebook', 'instagram', 'twitter'],
      });

      if (!user) {
        throw new NotFoundException('User Not Found');
      }

      const books = await this.bookRepository.find({
        where: { author: { id }, accessStatus: { id: 1 } },
        select: ['id', 'title', 'description', 'cover', 'createdAt'],
        order: { createdAt: 'DESC' },
      });

      return {
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        facebook: user.facebook,
        instagram: user.instagram,
        twitter: user.twitter,
        books: books.map((book) => ({
          id: book.id,
          title: book.title,
          description: book.description,
          cover: book.cover,
          createdAt: book.createdAt,
        })),
      };
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.getUserProfileById');
      throw error;
    }
  }

  async findAllAdminAndManagerIds(): Promise<number[]> {
    const admins = await this.userRepository.find({
      where: { role: { id: 1 } },
    });
    const managers = await this.userRepository.find({
      where: { role: { id: 2 } },
    });
    return [...admins.map((admin) => admin.id), ...managers.map((manager) => manager.id)];
  }

  async storeRecentSearch(
    userId: number,
    searchType: SearchType,
    searchValue: string,
    relatedId?: number,
  ): Promise<boolean> {
    try {
      if (!userId || !searchValue) {
        return false;
      }

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return false;
      }

      // Check if this search already exists
      const existingSearch = await this.userRecentSearchRepository.findOne({
        where: {
          user: { id: userId },
          searchType,
          searchValue,
        },
        order: { createdAt: 'DESC' },
      });

      // If it exists and was searched recently (within the past hour), don't create a duplicate
      if (
        existingSearch &&
        new Date().getTime() - existingSearch.createdAt.getTime() < 60 * 60 * 1000
      ) {
        return true;
      }

      // Create new search record
      const recentSearch = this.userRecentSearchRepository.create({
        user,
        searchType,
        searchValue,
        relatedId,
      });

      await this.userRecentSearchRepository.save(recentSearch);
      return true;
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.storeRecentSearch');
      return false;
    }
  }

  async getRecentSearches(
    userId: number,
    searchType?: SearchType,
  ): Promise<RecentSearchResponseDto[]> {
    try {
      if (!userId) {
        return [];
      }

      const queryBuilder = this.userRecentSearchRepository
        .createQueryBuilder('search')
        .where('search.user_id = :userId', { userId });

      if (searchType) {
        queryBuilder.andWhere('search.searchType = :searchType', { searchType });
      }

      const searches = await queryBuilder
        .orderBy('search.created_at', 'DESC')
        .limit(5)
        .getMany();

      return plainToInstance(RecentSearchResponseDto, searches, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.loggerService.err(error.message, 'UserService.getRecentSearches');
      return [];
    }
  }

  // Helper method to calculate date range based on period (same as activities service)
  private getDateRangeFromPeriod(period: TimePeriod, startDate?: string, endDate?: string): { startDate: Date, endDate: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);
    
    // Set end to end of current day
    end.setHours(23, 59, 59, 999);
    
    switch (period) {
      case TimePeriod.TODAY:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.THIS_WEEK:
        start = new Date(now);
        // Get the first day of the current week (Sunday = 0)
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek;
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.THIS_MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.LAST_MONTH:
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
        
      case TimePeriod.LAST_3_MONTHS:
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.LAST_6_MONTHS:
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.THIS_YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        break;
        
      case TimePeriod.CUSTOM:
        if (!startDate || !endDate) {
          throw new BadRequestException('Start date and end date are required for custom period');
        }
        
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        break;
        
      default:
        throw new BadRequestException('Invalid time period');
    }
    
    return { startDate: start, endDate: end };
  }

  // Helper method to generate time intervals based on period
  private generateTimeIntervals(period: TimePeriod, startDate: Date, endDate: Date): Date[] {
    const intervals: Date[] = [];
    const current = new Date(startDate);
    
    switch (period) {
      case TimePeriod.TODAY:
        // Generate 24 hour intervals (every 2 hours for readability)
        for (let hour = 0; hour < 24; hour += 2) {
          const intervalStart = new Date(current);
          intervalStart.setHours(hour, 0, 0, 0);
          intervals.push(intervalStart);
        }
        break;
        
      case TimePeriod.THIS_WEEK:
        // Generate 7 daily intervals
        for (let day = 0; day < 7; day++) {
          const intervalStart = new Date(current);
          intervalStart.setDate(current.getDate() + day);
          intervalStart.setHours(0, 0, 0, 0);
          intervals.push(intervalStart);
        }
        break;
        
      case TimePeriod.THIS_MONTH:
      case TimePeriod.LAST_MONTH:
        // Generate daily intervals for the month
        while (current <= endDate) {
          const intervalStart = new Date(current);
          intervalStart.setHours(0, 0, 0, 0);
          intervals.push(intervalStart);
          current.setDate(current.getDate() + 1);
        }
        break;
        
      case TimePeriod.LAST_3_MONTHS:
        // Generate monthly intervals for 3 months
        for (let month = 0; month < 3; month++) {
          const intervalStart = new Date(startDate);
          intervalStart.setMonth(startDate.getMonth() + month);
          intervalStart.setDate(1);
          intervalStart.setHours(0, 0, 0, 0);
          intervals.push(intervalStart);
        }
        break;
        
      case TimePeriod.LAST_6_MONTHS:
        // Generate monthly intervals for 6 months
        for (let month = 0; month < 6; month++) {
          const intervalStart = new Date(startDate);
          intervalStart.setMonth(startDate.getMonth() + month);
          intervalStart.setDate(1);
          intervalStart.setHours(0, 0, 0, 0);
          intervals.push(intervalStart);
        }
        break;
        
      case TimePeriod.THIS_YEAR:
        // Generate monthly intervals for 12 months
        for (let month = 0; month < 12; month++) {
          const intervalStart = new Date(startDate);
          intervalStart.setMonth(startDate.getMonth() + month);
          intervalStart.setDate(1);
          intervalStart.setHours(0, 0, 0, 0);
          intervals.push(intervalStart);
        }
        break;
        
      case TimePeriod.CUSTOM:
        // Calculate the difference in days
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30) {
          // Generate daily intervals for periods <= 30 days
          while (current <= endDate) {
            const intervalStart = new Date(current);
            intervalStart.setHours(0, 0, 0, 0);
            intervals.push(intervalStart);
            current.setDate(current.getDate() + 1);
          }
        } else {
          // Generate monthly intervals for periods > 30 days
          const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          
          const currentMonth = new Date(startMonth);
          while (currentMonth <= endMonth) {
            intervals.push(new Date(currentMonth));
            currentMonth.setMonth(currentMonth.getMonth() + 1);
          }
        }
        break;
    }
    
    return intervals;
  }

  // Get user statistics with chart data and overview
  async getUserStatisticsWithChart(
    period: TimePeriod,
    startDate?: string,
    endDate?: string
  ): Promise<{
    chart: Array<{
      period: string;
      totalUsers: number;
    }>;
    overview: {
      totalUsers: number;
    };
  }> {
    const { startDate: start, endDate: end } = this.getDateRangeFromPeriod(period, startDate, endDate);
    
    // Generate time intervals based on period
    const intervals = this.generateTimeIntervals(period, start, end);
    
    // Calculate the difference in days for custom periods
    let isCustomDaily = false;
    if (period === TimePeriod.CUSTOM) {
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isCustomDaily = diffDays <= 30;
    }
    
    // Generate chart data for each interval
    const chartData = await Promise.all(intervals.map(async (intervalStart) => {
      let intervalEnd: Date;
      
      switch (period) {
        case TimePeriod.TODAY:
          intervalEnd = new Date(intervalStart);
          intervalEnd.setHours(intervalStart.getHours() + 2, 0, 0, 0);
          break;
          
        case TimePeriod.THIS_WEEK:
        case TimePeriod.THIS_MONTH:
        case TimePeriod.LAST_MONTH:
          intervalEnd = new Date(intervalStart);
          intervalEnd.setDate(intervalStart.getDate() + 1);
          intervalEnd.setMilliseconds(-1);
          break;
          
        case TimePeriod.LAST_3_MONTHS:
        case TimePeriod.LAST_6_MONTHS:
        case TimePeriod.THIS_YEAR:
          intervalEnd = new Date(intervalStart);
          intervalEnd.setMonth(intervalStart.getMonth() + 1);
          intervalEnd.setMilliseconds(-1);
          break;
          
        case TimePeriod.CUSTOM:
          if (isCustomDaily) {
            // Daily intervals
            intervalEnd = new Date(intervalStart);
            intervalEnd.setDate(intervalStart.getDate() + 1);
            intervalEnd.setMilliseconds(-1);
          } else {
            // Monthly intervals
            intervalEnd = new Date(intervalStart);
            intervalEnd.setMonth(intervalStart.getMonth() + 1);
            intervalEnd.setMilliseconds(-1);
          }
          break;
          
        default:
          intervalEnd = new Date(intervalStart);
          intervalEnd.setDate(intervalStart.getDate() + 1);
          intervalEnd.setMilliseconds(-1);
      }
      
      // Get users created in this interval
      const intervalUsers = await this.userRepository.count({
        where: {
          createdAt: Between(intervalStart, intervalEnd)
        }
      });
      
      // Format period label
      let periodLabel: string;
      switch (period) {
        case TimePeriod.TODAY:
          periodLabel = `${intervalStart.getHours()}h`;
          break;
        case TimePeriod.THIS_WEEK:
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          periodLabel = dayNames[intervalStart.getDay()];
          break;
        case TimePeriod.THIS_MONTH:
        case TimePeriod.LAST_MONTH:
          periodLabel = intervalStart.getDate().toString();
          break;
        case TimePeriod.LAST_3_MONTHS:
        case TimePeriod.LAST_6_MONTHS:
        case TimePeriod.THIS_YEAR:
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          periodLabel = monthNames[intervalStart.getMonth()];
          break;
        case TimePeriod.CUSTOM:
          if (isCustomDaily) {
            // Show day number for daily intervals
            periodLabel = intervalStart.getDate().toString();
          } else {
            // Show month name for monthly intervals
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            periodLabel = monthNames[intervalStart.getMonth()];
          }
          break;
        default:
          periodLabel = intervalStart.toISOString().split('T')[0];
      }
      
      return {
        period: periodLabel,
        totalUsers: intervalUsers,
      };
    }));
    
    // Calculate overview statistics for the entire period
    const totalUsers = await this.userRepository.count({
      where: {
        createdAt: Between(start, end)
      }
    });
    
    return {
      chart: chartData,
      overview: {
        totalUsers,
      }
    };
  }
}

const generatePassword = (length) => {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
};

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '@features/user/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { PaginationResponseDto } from '@shared/dto/common/pagnination/pagination-response.dto';
import { GetNotificationsFilterDto } from './dto/get-notifications.dto';
import { LoggerService } from '@core/logger/logger.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly loggerService: LoggerService
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    try {
      const { userId, ...restDto } = createNotificationDto;
      
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const notification = this.notificationRepository.create({
        user,
        expiresAt: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
        ...restDto
      });

      const savedNotification = await this.notificationRepository.save(notification);
      return plainToInstance(NotificationResponseDto, savedNotification, {
        excludeExtraneousValues: true
      });
    } catch (error) {
      this.loggerService.err(
        error.message,
        'NotificationService.create'
      );
      throw error;
    }
  }

  async findAll(
    userId: number,
    filter: GetNotificationsFilterDto
  ): Promise<PaginationResponseDto<NotificationResponseDto>> {
    try {
      const { limit = 10, page = 1, type, isRead, sortBy = 'createdAt', sortDirection = 'DESC' } = filter;
      
      const queryBuilder = this.notificationRepository
        .createQueryBuilder('notification')
        .leftJoinAndSelect('notification.user', 'user')
        .where('user.id = :userId', { userId });

      // Apply filters
      if (type !== undefined) {
        queryBuilder.andWhere('notification.type = :type', { type });
      }

      if (isRead !== undefined) {
        queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
      }

      // Check for expired notifications and exclude them
      queryBuilder.andWhere('(notification.expiresAt IS NULL OR notification.expiresAt > :now)', {
        now: new Date(),
      });

      // Apply sorting
      queryBuilder.orderBy(`notification.${sortBy}`, sortDirection);

      // Apply pagination
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [notifications, totalItems] = await queryBuilder.getManyAndCount();

      return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: plainToInstance(NotificationResponseDto, notifications, {
          excludeExtraneousValues: true
        })
      };
    } catch (error) {
      this.loggerService.err(
        error.message,
        'NotificationService.findAll'
      );
      throw error;
    }
  }

  async findOne(id: number): Promise<NotificationResponseDto> {
    try {
      const notification = await this.notificationRepository.findOne({ 
        where: { id },
        relations: ['user']
      });

      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      return plainToInstance(NotificationResponseDto, notification, {
        excludeExtraneousValues: true
      });
    } catch (error) {
      this.loggerService.err(
        error.message,
        'NotificationService.findOne'
      );
      throw error;
    }
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto): Promise<NotificationResponseDto> {
    try {
      const notification = await this.notificationRepository.findOne({ where: { id } });
      
      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      // If marking as read, set the readAt timestamp
      if (updateNotificationDto.isRead && !notification.isRead) {
        updateNotificationDto.readAt = new Date();
      }

      const updatedNotification = await this.notificationRepository.save({
        ...notification,
        ...updateNotificationDto
      });

      return plainToInstance(NotificationResponseDto, updatedNotification, {
        excludeExtraneousValues: true
      });
    } catch (error) {
      this.loggerService.err(
        error.message,
        'NotificationService.update'
      );
      throw error;
    }
  }

  async markAsRead(id: number, userId: number): Promise<NotificationResponseDto> {
    try {
      const notification = await this.notificationRepository.findOne({ 
        where: { id },
        relations: ['user']
      });
      
      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      if (notification.user.id !== userId) {
        throw new BadRequestException('You can only mark your own notifications as read');
      }

      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date();
        await this.notificationRepository.save(notification);
      }

      return plainToInstance(NotificationResponseDto, notification, {
        excludeExtraneousValues: true
      });
    } catch (error) {
      this.loggerService.err(
        error.message,
        'NotificationService.markAsRead'
      );
      throw error;
    }
  }

  async markAllAsRead(userId: number): Promise<boolean> {
    try {
      const result = await this.notificationRepository.update(
        { user: { id: userId }, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      this.loggerService.err(
        error.message,
        'NotificationService.markAllAsRead'
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const notification = await this.notificationRepository.findOne({ where: { id } });
      
      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      await this.notificationRepository.remove(notification);
    } catch (error) {
      this.loggerService.err(
        error.message,
        'NotificationService.remove'
      );
      throw error;
    }
  }

  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const now = new Date();
      const result = await this.notificationRepository.delete({
        expiresAt: LessThan(now)
      });
      
      return result.affected ?? 0;
    } catch (error) {
      this.loggerService.err(
        error.message,
        'NotificationService.cleanupExpiredNotifications'
      );
      throw error;
    }
  }

  async getUnreadCount(userId: number): Promise<number> {
    try {
      return await this.notificationRepository.count({
        where: {
          user: { id: userId },
          isRead: false,
        //   expiresAt: LessThan(new Date()),
        },
      });
    } catch (error) {
      this.loggerService.err(
        error.message,
        'NotificationService.getUnreadCount'
      );
      throw error;
    }
  }
}

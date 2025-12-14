import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';
import { UserPublicDto } from '@features/user/dto/get-user-response.dto';

export class NotificationResponseDto {
  @ApiProperty({ example: 1, description: 'Notification ID' })
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty({ 
    enum: NotificationType,
    example: NotificationType.BOOK_UPDATED,
    description: 'Notification type'
  })
  @Expose()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Book updated', description: 'Short notification title' })
  @Expose()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Your book has been updated with new content', description: 'Longer notification message' })
  @Expose()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ 
    example: { bookId: 1, chapterId: 5 },
    description: 'Additional data related to the notification'
  })
  @Expose()
  @IsObject()
  data: Record<string, any>;

  @ApiProperty({ example: false, description: 'Whether the notification has been read' })
  @Expose()
  @IsNotEmpty()
  isRead: boolean;

  @ApiProperty({ example: '2023-01-01T12:00:00Z', description: 'When the notification was created' })
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiPropertyOptional({ example: '2023-01-01T12:00:00Z', description: 'When the notification was read' })
  @Expose()
  @IsOptional()
  @IsDate()
  readAt?: Date;

  @ApiPropertyOptional({ example: '2023-12-31T23:59:59Z', description: 'When the notification expires' })
  @Expose()
  @IsOptional()
  @IsDate()
  expiresAt?: Date;
} 
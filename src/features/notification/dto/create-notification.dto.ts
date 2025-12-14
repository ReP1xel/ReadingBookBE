import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ 
    enum: NotificationType,
    example: NotificationType.BOOK_UPDATED,
    description: 'Notification type'
  })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Book updated', description: 'Short notification title' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: 'Your book has been updated with new content', description: 'Longer notification message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ 
    example: { bookId: 1, chapterId: 5 },
    description: 'Additional data related to the notification'
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ 
    example: '2023-12-31T23:59:59Z',
    description: 'Expiration date for the notification'
  })
  @IsOptional()
  @IsString()
  expiresAt?: Date;
}

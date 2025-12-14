import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../entities/notification.entity';
import { PaginationRequestDto } from '@shared/dto/common/pagnination/pagination-request.dto';

export class GetNotificationsFilterDto extends PaginationRequestDto {
  @ApiPropertyOptional({ 
    enum: NotificationType,
    example: NotificationType.BOOK_UPDATED,
    description: 'Filter by notification type'
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ 
    example: false,
    description: 'Filter by read status'
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiPropertyOptional({ 
    example: 'createdAt',
    description: 'Field to sort by',
    enum: ['createdAt', 'readAt']
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'readAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ 
    example: 'DESC',
    description: 'Sort direction',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC' = 'DESC';
} 
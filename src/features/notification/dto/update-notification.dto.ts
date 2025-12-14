import { PartialType } from '@nestjs/swagger';
import { CreateNotificationDto } from './create-notification.dto';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
  @ApiPropertyOptional({ example: true, description: 'Mark notification as read' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ example: '2023-01-01T12:00:00Z', description: 'When the notification was read' })
  @IsOptional()
  @IsDate()
  readAt?: Date;
}

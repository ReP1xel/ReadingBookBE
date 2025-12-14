import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/jwt-auth.guard';
import { GetNotificationsFilterDto } from './dto/get-notifications.dto';
import { AdminGuard } from '@core/auth/admin.guard';

@ApiTags('notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification (Admin)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req, @Query() filter: GetNotificationsFilterDto) {
    return this.notificationService.findAll(req.user.id, filter);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@Req() req) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(+id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  markAsRead(@Param('id') id: string, @Req() req) {
    return this.notificationService.markAsRead(+id, req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  markAllAsRead(@Req() req) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification (Admin)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.update(+id, updateNotificationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification (Admin)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.notificationService.remove(+id);
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Cleanup expired notifications (Admin)' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AdminGuard)
  cleanup() {
    return this.notificationService.cleanupExpiredNotifications();
  }
}

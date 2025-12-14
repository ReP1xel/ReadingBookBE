import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  Optional,
  Header,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '@core/auth/jwt-auth.guard';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';
import { UserActivity } from './entities/user-activity.entity';
import { ActivityStatusResponseDto } from './dto/activity-status.dto';
import { Activity, ACTIVITY_TYPE } from './entities/activity.entity';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { CreatePageViewDto } from './dto/create-page-view.dto';
import { Visit } from './entities/visit.entity';
import { PageView } from './entities/page-view.entity';
import { TimePeriod, TimeRangeDto } from './dto/time-range.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getActivities(
    @Request() req,
    @Query('type') type?: ACTIVITY_TYPE,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('earnedPoint') earnedPoint?: number,
    @Query('isEarnedPoint') isEarnedPoint?: boolean,
    @Query('userId') userId?: number,
  ): Promise<UserActivity[] | Activity[]> {
    return this.activitiesService.getActivities(req.user, {
      type,
      date,
      startDate,
      endDate,
      earnedPoint,
      isEarnedPoint,
      userId
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createUserActivity(
    @Request() req,
    @Body() createUserActivityDto: CreateUserActivityDto,
  ): Promise<UserActivity> {
    // User is creating activity for themselves
    return this.activitiesService.createUserActivity(
      req.user,
      createUserActivityDto.activityType,
      createUserActivityDto.relatedEntityId
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('available')
  async getUserAvailableActivities(
    @Request() req
  ): Promise<ActivityStatusResponseDto[]> {
    const userId = req.user.id;
    return this.activitiesService.getUserAvailableActivities(userId);
  }

  // Visit tracking endpoints
  @Post('visits')
  @HttpCode(HttpStatus.CREATED)
  async createVisit(
    @Body() createVisitDto: CreateVisitDto,
    @Request() req,
  ): Promise<Visit> {
    const userId = req.user?.id || createVisitDto.userId;
    return this.activitiesService.createVisit(createVisitDto, userId);
  }

  @Patch('visits/:id')
  async updateVisit(
    @Param('id') id: string,
    @Body() updateVisitDto: UpdateVisitDto,
  ): Promise<Visit> {
    return this.activitiesService.updateVisit(id, updateVisitDto);
  }

  @Get('visits/visitor/:visitorId')
  async getVisitsByVisitorId(
    @Param('visitorId') visitorId: string,
  ): Promise<Visit[]> {
    return this.activitiesService.getVisitsByVisitorId(visitorId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('visits/user')
  async getVisitsByUser(@Request() req): Promise<Visit[]> {
    return this.activitiesService.getVisitsByUserId(req.user.id);
  }

  // Time range endpoints for visits
  @Get('visits/statistics')
  async getVisitStatistics(
    @Query('period') period: TimePeriod = TimePeriod.TODAY,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    chart: Array<{
      period: string;
      totalVisits: number;
      uniqueVisitors: number;
      avgDuration: number;
      bounceRate: number;
    }>;
    overview: {
      totalVisits: number;
      uniqueVisitors: number;
      avgDuration: number;
      bounceRate: number;
    };
  }> {
    return this.activitiesService.getVisitStatisticsWithChart(
      period,
      startDate,
      endDate
    );
  }

  @Get('visits/range')
  async getVisitsByTimeRange(
    @Query('period') period: TimePeriod = TimePeriod.TODAY,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: number,
    @Query('visitorId') visitorId?: string,
  ): Promise<Visit[]> {
    return this.activitiesService.getVisitsByTimeRange(
      period,
      startDate,
      endDate,
      userId,
      visitorId
    );
  }

  @Get('visits/stats')
  async getVisitStats(
    @Query('period') period: TimePeriod = TimePeriod.TODAY,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ totalVisits: number; uniqueVisitors: number; avgDuration: number }> {
    return this.activitiesService.getVisitStatsByTimeRange(
      period,
      startDate,
      endDate
    );
  }

  // Page view tracking endpoints
  @Post('page-views')
  @HttpCode(HttpStatus.CREATED)
  async createPageView(
    @Body() createPageViewDto: CreatePageViewDto,
  ): Promise<PageView> {
    return this.activitiesService.createPageView(createPageViewDto);
  }

  @Get('visits/:visitId/page-views')
  async getPageViewsByVisitId(
    @Param('visitId') visitId: string,
  ): Promise<PageView[]> {
    return this.activitiesService.getPageViewsByVisitId(visitId);
  }

  // Time range endpoints for page views
  @Get('page-views/range')
  async getPageViewsByTimeRange(
    @Query('period') period: TimePeriod = TimePeriod.TODAY,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('bookId') bookId?: number,
    @Query('chapterId') chapterId?: number,
    @Query('visitId') visitId?: string,
  ): Promise<PageView[]> {
    return this.activitiesService.getPageViewsByTimeRange(
      period,
      startDate,
      endDate,
      bookId,
      chapterId,
      visitId
    );
  }

  @Get('page-views/stats')
  async getPageViewStats(
    @Query('period') period: TimePeriod = TimePeriod.TODAY,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ totalPageViews: number; uniqueBooks: number; uniqueChapters: number }> {
    return this.activitiesService.getPageViewStatsByTimeRange(
      period,
      startDate,
      endDate
    );
  }

  @Get('bounce-rate')
  async getBounceRate(
    @Query('period') period: TimePeriod = TimePeriod.TODAY,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ bounceRate: number; totalVisits: number; singlePageVisits: number }> {
    return this.activitiesService.getBounceRateByTimeRange(
      period,
      startDate,
      endDate
    );
  }

  @Post('visits/:id/end')
  @HttpCode(HttpStatus.OK)
  async endVisitSession(
    @Param('id') id: string,
  ): Promise<Visit> {
    console.log('endVisitSession',id);
    return this.activitiesService.endVisitSession(id);
  }


  @Get('visits/:id')
  async getVisit(@Param('id') id: string): Promise<Visit> {
    return this.activitiesService.getVisitById(id);
  }
} 
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { Activity, ACTIVITY_TYPE } from './entities/activity.entity';
import { UserActivity } from './entities/user-activity.entity';
import { User } from '@features/user/entities/user.entity';
import { ActivityDto, ActivityStatus, ActivityStatusResponseDto } from './dto/activity-status.dto';
import { plainToInstance } from 'class-transformer';
import { Visit } from './entities/visit.entity';
import { PageView } from './entities/page-view.entity';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { CreatePageViewDto } from './dto/create-page-view.dto';
import { TimePeriod } from './dto/time-range.dto';
import { NotificationGateway } from '@core/gateway/notification.gateway';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(PageView)
    private readonly pageViewRepository: Repository<PageView>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async findAllActivities(): Promise<Activity[]> {
    return this.activityRepository.find();
  }

  async findActivityByType(type: ACTIVITY_TYPE): Promise<Activity | null> {
    return this.activityRepository.findOne({ where: { activityType: type } });
  }

  async getUserActivitiesByType(
    userId: number,
    activityType: ACTIVITY_TYPE,
  ): Promise<UserActivity[]> {
    return this.userActivityRepository.find({
      where: {
        user: { id: userId },
        activityType,
      },
      relations: ['activity'],
    });
  }

  async getUserActivitiesByFilter(filterOptions: {
    userId: number;
    type?: ACTIVITY_TYPE;
    date?: Date;
    startDate?: Date;
    endDate?: Date;
    earnedPoint?: number;
    isEarnedPoint?: boolean;
  }): Promise<UserActivity[]> {
    const { userId, type, date, startDate, endDate, earnedPoint, isEarnedPoint } = filterOptions;
    
    const queryBuilder = this.userActivityRepository.createQueryBuilder('userActivity')
      .leftJoinAndSelect('userActivity.activity', 'activity')
      .where('userActivity.user_id = :userId', { userId });
    
    if (type) {
      queryBuilder.andWhere('userActivity.activity_type = :type', { type });
    }
    
    if (date) {
      queryBuilder.andWhere('userActivity.activity_date = :date', { date });
    }
    
    if (startDate && endDate) {
      queryBuilder.andWhere('userActivity.activity_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('userActivity.activity_date >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('userActivity.activity_date <= :endDate', { endDate });
    }
    
    if (earnedPoint !== undefined) {
      if (isEarnedPoint) {
        queryBuilder.andWhere('userActivity.earned_point > 0');
      } else {
        queryBuilder.andWhere('userActivity.earned_point = :earnedPoint', { earnedPoint });
      }
    }
    
    return queryBuilder.getMany();
  }

  async getUserAvailableActivities(userId: number): Promise<ActivityStatusResponseDto[]> {
    // Get all activities
    const activities = await this.activityRepository.find();
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    // Filter out comment_chapter activity for non-VIP users
    const filteredActivities = activities.filter(activity => {
      if (activity.activityType === ACTIVITY_TYPE.COMMENT_CHAPTER && !user?.isVip) {
        return false;
      }
      return true;
    });
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create date range for today (to handle timezone issues)
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Process each activity
    const result: ActivityStatusResponseDto[] = [];
    
    for (const activity of filteredActivities) {
      // Check user's history with this activity
      const userActivities = await this.userActivityRepository.find({
        where: {
          user: { id: userId },
          activityType: activity.activityType,
        },
        order: { activityDate: 'DESC' },
      });
      
      // Get today's activities for this type
      const todayActivities = await this.userActivityRepository.find({
        where: {
          user: { id: userId },
          activityType: activity.activityType,
          activityDate: Between(startOfToday, endOfToday),
        },
      });
      
      // Calculate statistics
      const completedCount = todayActivities.length;
      let status = ActivityStatus.NOT_STARTED;
      let currentStreak = 0;
      
      // Determine status based on maxPerDay or completion
      if (completedCount > 0) {
        if (activity.maxPerDay && completedCount >= activity.maxPerDay) {
          status = ActivityStatus.DONE;
        } else {
          status = ActivityStatus.IN_PROGRESS;
        }
      }
      
      // Calculate streak if relevant
      if (activity.streakBased && userActivities.length > 0) {
        currentStreak = userActivities[0].currentStreak || 0;
      }
      
      // Transform the activity entity to DTO
      const activityDto = plainToInstance(ActivityDto, activity, {
        excludeExtraneousValues: true,
      });
      
      // Create the response object
      const activityStatus = {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        activityType: activity.activityType,
        maxPerDay: activity.maxPerDay,
        streakBased: activity.streakBased,
        basePoint: activity.basePoint,
        maxStreakPoint: activity.maxStreakPoint,
        status,
        currentStreak,
        completedCount,
        activity: activityDto,
      };
      
      result.push(plainToInstance(ActivityStatusResponseDto, activityStatus, {
        excludeExtraneousValues: true,
      }));
    }
    
    return result;
  }

  async createUserActivity(
    user: User,
    activityType: ACTIVITY_TYPE,
    relatedEntityId?: number,
  ): Promise<UserActivity> {
    // Find the activity
    const activity = await this.findActivityByType(activityType);
    if (!activity) {
      throw new NotFoundException(`Activity with type ${activityType} not found`);
    }

    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create date range for today (to handle timezone issues)
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
     
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Calculate earned points and streak
    let earnedPoints = 0;
    let currentStreak = 0;
    
    if (activity.streakBased) {
      // For streak-based activities like login
      // Check if there was an activity yesterday to determine streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Create date range for yesterday (to handle timezone issues)
      const startOfYesterday = new Date(yesterday);
      startOfYesterday.setHours(0, 0, 0, 0);
      
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      
      const yesterdayActivity = await this.userActivityRepository.findOne({
        where: {
          user: { id: user.id },
          activityType,
          activityDate: Between(startOfYesterday, endOfYesterday),
        },
      });
      
      if (yesterdayActivity) {
        // If there was activity yesterday, increase the streak
        currentStreak = (yesterdayActivity.currentStreak || 0) + 1;
      } else {
        // Reset streak to 1 as there was no activity yesterday
        currentStreak = 1;
      }
      
      // Calculate points based on streak (limited by maxStreakPoint)
      earnedPoints = currentStreak >= activity.maxStreakPoint 
        ? activity.maxStreakPoint * activity.basePoint 
        : currentStreak * activity.basePoint;

    } else {
      // For non-streak activities, check max_per_day limit
      if (activity.maxPerDay) {
        // Count activities of this type done today
        let todayActivitiesCount = 0;
        
        if (relatedEntityId) {
          todayActivitiesCount = await this.userActivityRepository.count({
            where: {
              user: { id: user.id },
              activityType,
              activityDate: Between(startOfToday, endOfToday),
              relatedEntityId,
            },
          });
        } else {
          todayActivitiesCount = await this.userActivityRepository.count({
            where: {
              user: { id: user.id },
              activityType,
              activityDate: Between(startOfToday, endOfToday),
            },
          });
        }
        // If under the daily limit, award points
        if (todayActivitiesCount < activity.maxPerDay) {
            if (activity.activityType === ACTIVITY_TYPE.COMMENT_CHAPTER) {
              const freshUser = await this.userRepository.findOne({ where: { id: user.id } });
              if (freshUser?.isVip) {
                earnedPoints = activity.basePoint;
              } else {
                earnedPoints = 0;
              }
            } else {
              earnedPoints = activity.basePoint;
            }
        } else {
          // User already reached the daily maximum for this activity
          earnedPoints = 0;
        }
      } else {
        // No daily limit, always award points
        earnedPoints = activity.basePoint;
      }
    }

    if (earnedPoints > 0) {
      const earnedTodayCount = await this.userActivityRepository.count({
        where: {
          user: { id: user.id },
          activityType,
          activityDate: Between(startOfToday, endOfToday),
          earnedPoint: MoreThan(0),
        },
      });

      if (earnedTodayCount < (activity.maxPerDay || Infinity)) {
        await this.userRepository.createQueryBuilder()  
          .update()
          .set({
            tokenBalance: () => `"token_balance" + ${earnedPoints}`,
            tokenEarned: () => `"token_earned" + ${earnedPoints}`,
          })
          .where('id = :id', { id: user.id })
          .execute();
      } else {
        // User already reached the daily maximum for this activity
        earnedPoints = 0;
      }
    }

    // Create a new user activity record
    const userActivity = this.userActivityRepository.create({
      user,
      activityType,
      activityDate: today,
      relatedEntityId,
      currentStreak,
      earnedPoint: earnedPoints,
      activity,
    });

    const savedUserActivity = await this.userActivityRepository.save(userActivity);

    // Send notification if points were earned
    if (earnedPoints > 0) {
      await this.notificationGateway.sendPointsEarnedNotification(
        user.id,
        earnedPoints,
        activity.title,
        activityType
      );
    }

    return savedUserActivity;
  }

  async getActivities(
    user: any,
    filterParams: {
      type?: ACTIVITY_TYPE,
      date?: string,
      startDate?: string,
      endDate?: string,
      earnedPoint?: number,
      isEarnedPoint?: boolean,
      userId?: number,
    }
  ): Promise<UserActivity[] | Activity[]> {
    const { type, date, startDate, endDate, earnedPoint, userId, isEarnedPoint } = filterParams;
    
    // If no filter parameters are provided, return all activities
    if (!type && !date && !startDate && !endDate && !earnedPoint && !userId && !isEarnedPoint) {
      return this.findAllActivities();
    }
    
    // Handle filtering logic for user activities
    const currentUserId = user.id;
    let queryUserId = currentUserId;
    
    if (userId && userId !== currentUserId) {
      // Check if user is admin before allowing to query other users
      const isAdmin = user.role && user.role.id === 1;
      if (!isAdmin) {
        throw new Error('You do not have permission to view other users\' activities');
      }
      queryUserId = userId;
    }
    
    // Parse dates
    let parsedDate: Date | undefined;
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;
    
    if (date) {
      parsedDate = new Date(date);
      parsedDate.setHours(0, 0, 0, 0);
    }
    
    if (startDate) {
      parsedStartDate = new Date(startDate);
      parsedStartDate.setHours(0, 0, 0, 0);
    }
    
    if (endDate) {
      parsedEndDate = new Date(endDate);
      parsedEndDate.setHours(23, 59, 59, 999);  // End of day
    }
    
    return this.getUserActivitiesByFilter({
      userId: queryUserId,
      type,
      date: parsedDate,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      earnedPoint,
      isEarnedPoint,
    });
  }

  // Visit tracking methods
  async createVisit(createVisitDto: CreateVisitDto, userId?: number): Promise<Visit> {
    const newVisit = new Visit();
    newVisit.visitorId = createVisitDto.visitorId;
    
    if (userId) {
      newVisit.userId = userId;
    }
    
    if (createVisitDto.userAgent) {
      newVisit.userAgent = createVisitDto.userAgent;
    }
    
    if (createVisitDto.referrer) {
      newVisit.referrer = createVisitDto.referrer;
    }

    return this.visitRepository.save(newVisit);
  }

  async endVisitSession(id: string): Promise<Visit> {
    const visit = await this.visitRepository.findOne({ where: { id } });
    
    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found`);
    }

    // If session is already ended, return the visit without changes
    if (visit.endedAt) {
      return visit;
    }

    // Set end time to current UTC time
    const endedAt = new Date();
    const startedAt = visit.startedAt;
    
    // Calculate duration in seconds
    const durationInSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
    
    // Update the visit
    visit.endedAt = endedAt;
    visit.duration = durationInSeconds > 0 ? durationInSeconds : 0;
    
    return this.visitRepository.save(visit);
  }

  async updateVisit(id: string, updateVisitDto: UpdateVisitDto): Promise<Visit> {
    const visit = await this.visitRepository.findOne({ where: { id } });
    
    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found`);
    }

    // Convert string dates to Date objects
    const endedAt = new Date(updateVisitDto.endedAt);
    const startedAt = visit.startedAt;
    
    // Calculate duration in seconds
    const durationInSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
    
    // Update the visit
    visit.endedAt = endedAt;
    visit.duration = durationInSeconds > 0 ? durationInSeconds : 0;
    
    return this.visitRepository.save(visit);
  }

  async getVisitById(id: string): Promise<Visit> {
    const visit = await this.visitRepository.findOne({ 
      where: { id },
      relations: ['pageViews']
    });
    
    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found`);
    }
    
    return visit;
  }

  async getVisitsByVisitorId(visitorId: string): Promise<Visit[]> {
    return this.visitRepository.find({
      where: { visitorId },
      order: { startedAt: 'DESC' }
    });
  }

  async getVisitsByUserId(userId: number): Promise<Visit[]> {
    return this.visitRepository.find({
      where: { userId },
      order: { startedAt: 'DESC' }
    });
  }

  // Page view tracking methods
  async createPageView(createPageViewDto: CreatePageViewDto): Promise<PageView> {
    // Check if visit exists
    const visit = await this.visitRepository.findOne({ 
      where: { id: createPageViewDto.visitId } 
    });
    
    if (!visit) {
      throw new NotFoundException(`Visit with ID ${createPageViewDto.visitId} not found`);
    }
    
    const newPageView = new PageView();
    newPageView.visitId = createPageViewDto.visitId;
    newPageView.url = createPageViewDto.url;
    
    if (createPageViewDto.chapterId) {
      newPageView.chapterId = createPageViewDto.chapterId;
    }
    
    if (createPageViewDto.bookId) {
      newPageView.bookId = createPageViewDto.bookId;
    }
    
    return this.pageViewRepository.save(newPageView);
  }

  async getPageViewsByVisitId(visitId: string): Promise<PageView[]> {
    return this.pageViewRepository.find({
      where: { visitId },
      order: { viewedAt: 'DESC' },
      relations: ['book', 'chapter']
    });
  }

  // Helper method to calculate date range based on period
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

  // Get visits by time range
  async getVisitsByTimeRange(
    period: TimePeriod,
    startDate?: string,
    endDate?: string,
    userId?: number,
    visitorId?: string
  ): Promise<Visit[]> {
    const { startDate: start, endDate: end } = this.getDateRangeFromPeriod(period, startDate, endDate);
    
    const queryBuilder = this.visitRepository.createQueryBuilder('visit')
      .where('visit.started_at BETWEEN :start AND :end', { start, end })
      .orderBy('visit.started_at', 'DESC');
    
    if (userId) {
      queryBuilder.andWhere('visit.user_id = :userId', { userId });
    }
    
    if (visitorId) {
      queryBuilder.andWhere('visit.visitor_id = :visitorId', { visitorId });
    }
    
    return queryBuilder.getMany();
  }

  // Get page views by time range
  async getPageViewsByTimeRange(
    period: TimePeriod,
    startDate?: string,
    endDate?: string,
    bookId?: number,
    chapterId?: number,
    visitId?: string
  ): Promise<PageView[]> {
    const { startDate: start, endDate: end } = this.getDateRangeFromPeriod(period, startDate, endDate);
    
    const queryBuilder = this.pageViewRepository.createQueryBuilder('pageView')
      .leftJoinAndSelect('pageView.book', 'book')
      .leftJoinAndSelect('pageView.chapter', 'chapter')
      .where('pageView.viewed_at BETWEEN :start AND :end', { start, end })
      .orderBy('pageView.viewed_at', 'DESC');
    
    if (bookId) {
      queryBuilder.andWhere('pageView.book_id = :bookId', { bookId });
    }
    
    if (chapterId) {
      queryBuilder.andWhere('pageView.chapter_id = :chapterId', { chapterId });
    }
    
    if (visitId) {
      queryBuilder.andWhere('pageView.visit_id = :visitId', { visitId });
    }
    
    return queryBuilder.getMany();
  }

  // Get visits statistics by time range
  async getVisitStatsByTimeRange(
    period: TimePeriod,
    startDate?: string,
    endDate?: string
  ): Promise<{ totalVisits: number, uniqueVisitors: number, avgDuration: number }> {
    const { startDate: start, endDate: end } = this.getDateRangeFromPeriod(period, startDate, endDate);
    
    // Get total visits
    const totalVisits = await this.visitRepository.count({
      where: {
        startedAt: Between(start, end)
      }
    });
    
    // Get unique visitors count by distinct visitorId
    const uniqueVisitors = await this.visitRepository
      .createQueryBuilder('visit')
      .select('COUNT(DISTINCT visit.visitor_id)', 'count')
      .where('visit.started_at BETWEEN :start AND :end', { start, end })
      .getRawOne();
    
    const uniqueVisitorsCount = uniqueVisitors?.count ? parseInt(uniqueVisitors.count) : 0;
    
    // Get average duration (only for visits with duration)
    const avgDurationResult = await this.visitRepository
      .createQueryBuilder('visit')
      .select('AVG(visit.duration)', 'avgDuration')
      .where('visit.started_at BETWEEN :start AND :end', { start, end })
      .andWhere('visit.duration IS NOT NULL')
      .getRawOne();

    
    const avgDuration = avgDurationResult?.avgDuration ? Math.round(avgDurationResult.avgDuration / 60) : 0;
    
    return {
      totalVisits,
      uniqueVisitors: uniqueVisitorsCount,
      avgDuration
    };
  }

  // Get page views statistics by time range
  async getPageViewStatsByTimeRange(
    period: TimePeriod,
    startDate?: string,
    endDate?: string
  ): Promise<{ totalPageViews: number, uniqueBooks: number, uniqueChapters: number }> {
    const { startDate: start, endDate: end } = this.getDateRangeFromPeriod(period, startDate, endDate);
    
    // Get total page views
    const totalPageViews = await this.pageViewRepository.count({
      where: {
        viewedAt: Between(start, end)
      }
    });
    
    // Get unique books viewed count
    const uniqueBooks = await this.pageViewRepository
      .createQueryBuilder('pageView')
      .select('pageView.book_id')
      .where('pageView.viewed_at BETWEEN :start AND :end', { start, end })
      .andWhere('pageView.book_id IS NOT NULL')
      .distinct(true)
      .getCount();
    
    // Get unique chapters viewed count
    const uniqueChapters = await this.pageViewRepository
      .createQueryBuilder('pageView')
      .select('pageView.chapter_id')
      .where('pageView.viewed_at BETWEEN :start AND :end', { start, end })
      .andWhere('pageView.chapter_id IS NOT NULL')
      .distinct(true)
      .getCount();
    
    return {
      totalPageViews,
      uniqueBooks,
      uniqueChapters
    };
  }

  // Get bounce rate by time range
  async getBounceRateByTimeRange(
    period: TimePeriod,
    startDate?: string,
    endDate?: string
  ): Promise<{ bounceRate: number, totalVisits: number, singlePageVisits: number }> {
    const { startDate: start, endDate: end } = this.getDateRangeFromPeriod(period, startDate, endDate);
    
    // Get all visits in the time range
    const totalVisits = await this.visitRepository.count({
      where: {
        startedAt: Between(start, end)
      }
    });
    
    // Get visits with their page view counts
    const visitPageViewCounts = await this.visitRepository
      .createQueryBuilder('visit')
      .leftJoin('visit.pageViews', 'pageView')
      .select('visit.id', 'visitId')
      .addSelect('COUNT(pageView.id)', 'pageViewCount')
      .where('visit.started_at BETWEEN :start AND :end', { start, end })
      .groupBy('visit.id')
      .getRawMany();
    
    // Count visits with exactly one page view (bounce visits)
    const singlePageVisits = visitPageViewCounts.filter(
      visit => parseInt(visit.pageViewCount) === 1
    ).length;
    
    // Calculate bounce rate as percentage
    const bounceRate = totalVisits > 0 ? Math.round((singlePageVisits / totalVisits) * 100 * 100) / 100 : 0;
    
    return {
      bounceRate,
      totalVisits,
      singlePageVisits
    };
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

  // Get combined visit statistics with chart data and overview
  async getVisitStatisticsWithChart(
    period: TimePeriod,
    startDate?: string,
    endDate?: string
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
    const { startDate: start, endDate: end } = this.getDateRangeFromPeriod(period, startDate, endDate);
    
    // Generate time intervals based on period
    const intervals = this.generateTimeIntervals(period, start, end);
    
    // Generate chart data for each interval
    const chartData = await Promise.all(intervals.map(async (intervalStart) => {
      let intervalEnd: Date;
      
      // Calculate the difference in days for custom periods
      let isCustomDaily = false;
      if (period === TimePeriod.CUSTOM) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isCustomDaily = diffDays <= 30;
      }
      
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
      
      // Get visits for this interval
      const intervalVisits = await this.visitRepository.count({
        where: {
          startedAt: Between(intervalStart, intervalEnd)
        }
      });
      
      // Get unique visitors for this interval
      const uniqueVisitors = await this.visitRepository
        .createQueryBuilder('visit')
        .select('COUNT(DISTINCT visit.visitor_id)', 'count')
        .where('visit.started_at BETWEEN :start AND :end', { 
          start: intervalStart, 
          end: intervalEnd 
        })
        .getRawOne();

        const uniqueVisitorsCount = uniqueVisitors?.count ? parseInt(uniqueVisitors.count) : 0;
      
      // Get average duration for this interval
      const avgDurationResult = await this.visitRepository
        .createQueryBuilder('visit')
        .select('AVG(visit.duration)', 'avgDuration')
        .where('visit.started_at BETWEEN :start AND :end', { 
          start: intervalStart, 
          end: intervalEnd 
        })
        .andWhere('visit.duration IS NOT NULL')
        .getRawOne();
      
      const avgDuration = avgDurationResult?.avgDuration ? Math.round(avgDurationResult.avgDuration) : 0;
      
      // Calculate bounce rate for this interval
      const visitPageViewCounts = await this.visitRepository
        .createQueryBuilder('visit')
        .leftJoin('visit.pageViews', 'pageView')
        .select('visit.id', 'visitId')
        .addSelect('COUNT(pageView.id)', 'pageViewCount')
        .where('visit.started_at BETWEEN :start AND :end', { 
          start: intervalStart, 
          end: intervalEnd 
        })
        .groupBy('visit.id')
        .getRawMany();
      
      const singlePageVisits = visitPageViewCounts.filter(
        visit => parseInt(visit.pageViewCount) === 1
      ).length;
      
      const bounceRate = intervalVisits > 0 ? Math.round((singlePageVisits / intervalVisits) * 100 * 100) / 100 : 0;
      
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
        totalVisits: intervalVisits,
        uniqueVisitors: uniqueVisitorsCount,
        avgDuration,
        bounceRate
      };
    }));
    
    // Calculate overview statistics for the entire period
    const totalVisits = await this.visitRepository.count({
      where: {
        startedAt: Between(start, end)
      }
    });
    
    const uniqueVisitors = await this.visitRepository
      .createQueryBuilder('visit')
      .select('visit.visitor_id')
      .where('visit.started_at BETWEEN :start AND :end', { start, end })
      .distinct(true)
      .getCount();
    
    const overallAvgDurationResult = await this.visitRepository
      .createQueryBuilder('visit')
      .select('AVG(visit.duration)', 'avgDuration')
      .where('visit.started_at BETWEEN :start AND :end', { start, end })
      .andWhere('visit.duration IS NOT NULL')
      .getRawOne();
    
    const overallAvgDuration = overallAvgDurationResult?.avgDuration ? Math.round(overallAvgDurationResult.avgDuration) : 0;
    
    // Calculate overall bounce rate
    const overallVisitPageViewCounts = await this.visitRepository
      .createQueryBuilder('visit')
      .leftJoin('visit.pageViews', 'pageView')
      .select('visit.id', 'visitId')
      .addSelect('COUNT(pageView.id)', 'pageViewCount')
      .where('visit.started_at BETWEEN :start AND :end', { start, end })
      .groupBy('visit.id')
      .getRawMany();
    
    const overallSinglePageVisits = overallVisitPageViewCounts.filter(
      visit => parseInt(visit.pageViewCount) === 1
    ).length;
    
    const overallBounceRate = totalVisits > 0 ? Math.round((overallSinglePageVisits / totalVisits) * 100 * 100) / 100 : 0;
    
    return {
      chart: chartData,
      overview: {
        totalVisits,
        uniqueVisitors,
        avgDuration: overallAvgDuration,
        bounceRate: overallBounceRate
      }
    };
  }
} 
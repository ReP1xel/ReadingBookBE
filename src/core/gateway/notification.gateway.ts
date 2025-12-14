import { LoggerService } from '@core/logger/logger.service';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from '@features/notification/notification.service';
import { CreateNotificationDto } from '@features/notification/dto/create-notification.dto';
import { NotificationType } from '@features/notification/entities/notification.entity';
import { Injectable } from '@nestjs/common';
import { UserService } from '@features/user/user.service';
import { User } from '@features/user/entities/user.entity';
import { Repository } from 'typeorm';
@Injectable()
@WebSocketGateway(3002, { cors: true, namespace: 'notification' })
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private loggerService: LoggerService,
    private notificationService: NotificationService,
    private userService: UserService,
  ) {}

  @WebSocketServer()
  server: Server;

  private readonly ADMIN_ROLE_ID = 1; // Assuming role ID 1 is for admins

  afterInit(server: Server) {
    this.loggerService.info('NotificationGateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
        console.warn('room', `user-${userId}`);
      client.join(`user-${userId}`);
    }
    this.loggerService.warn(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.loggerService.warn(`Client disconnected: ${client.id}`);
  }

  // Admin notifications
  async sendBookPendingApprovalNotification(bookId: number, bookTitle: string, authorId: number, adminIds: number[]) {
    const notificationData = {
      bookId,
      bookTitle,
      authorId
    };

    // Create database notification for each admin first
    for (const adminId of adminIds) {
      const notificationDto: CreateNotificationDto = {
        userId: adminId,
        type: NotificationType.BOOK_UPDATED,
        title: 'New Book Pending Approval',
        message: `A new book "${bookTitle}" is waiting for your approval`,
        data: { bookId, authorId }
      };
      
      // Save to database first
      await this.notificationService.create(notificationDto);
      
      // Then send via socket.io
      this.server.to(`user-${adminId}`).emit('book-pending-approval', notificationData);
    }
    
    this.loggerService.info('Sent book pending approval notification to admins');
  }

  // User notifications for book actions
  async sendBookFollowNotification(bookId: number, bookTitle: string, authorId: number, followerName: string) {
    const notificationData = {
      bookId,
      bookTitle,
      followerName
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId: authorId,
      type: NotificationType.BOOK_FOLLOWED,
      title: 'New Book Follower',
      message: `${followerName} is now following your book "${bookTitle}"`,
      data: { bookId, followerName }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${authorId}`).emit('book_followed', notificationData);
    
    this.loggerService.info('Sent book follow notification');
  }

  async sendBookRatingNotification(bookId: number, bookTitle: string, authorId: number, raterName: string, rating: number) {
    const notificationData = {
      bookId,
      bookTitle,
      raterName,
      rating
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId: authorId,
      type: NotificationType.BOOK_RATING,
      title: 'New Book Rating',
      message: `${raterName} rated your book "${bookTitle}" with ${rating} stars`,
      data: { bookId, raterName, rating }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${authorId}`).emit('book_rating', notificationData);
    
    this.loggerService.info('Sent book rating notification');
  }

  async sendChapterCommentNotification(bookId: number, bookTitle: string, chapterId: number, chapterTitle: string, authorId: number, commenterName: string) {
    const notificationData = {
      bookId,
      bookTitle,
      chapterId,
      chapterTitle,
      commenterName
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId: authorId,
      type: NotificationType.CHAPTER_COMMENT,
      title: 'New Chapter Comment',
      message: `${commenterName} commented on your chapter "${chapterTitle}" from book "${bookTitle}"`,
      data: { bookId, chapterId, commenterName }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${authorId}`).emit('chapter_comment', notificationData);
    
    this.loggerService.info('Sent chapter comment notification');
  }

  async sendCommentReplyNotification(bookId: number, bookTitle: string, chapterId: number, chapterTitle: string, commentOwnerId: number, replierName: string) {
    const notificationData = {
      bookId,
      bookTitle,
      chapterId,
      chapterTitle,
      replierName
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId: commentOwnerId,
      type: NotificationType.COMMENT_REPLY,
      title: 'New Reply to Your Comment',
      message: `${replierName} replied to your comment on chapter "${chapterTitle}" from book "${bookTitle}"`,
      data: { bookId, chapterId, replierName }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${commentOwnerId}`).emit('chapter-comment-reply', notificationData);
    
    this.loggerService.info('Sent comment reply notification');
  }

  // Book status notifications
  async sendBookApprovalNotification(bookId: number, bookTitle: string, authorId: number) {
    const notificationData = {
      bookId,
      bookTitle,
      status: 'approved'
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId: authorId,
      type: NotificationType.BOOK_UPDATED,
      title: 'Book Approved',
      message: `Your book "${bookTitle}" has been approved and is now published`,
      data: { bookId, status: 'approved' }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${authorId}`).emit('book_status', notificationData);
    
    this.loggerService.info('Sent book approval notification');
  }

  async sendBookRejectionNotification(bookId: number, bookTitle: string, authorId: number, reason: string) {
    const notificationData = {
      bookId,
      bookTitle,
      status: 'rejected',
      reason
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId: authorId,
      type: NotificationType.BOOK_UPDATED,
      title: 'Book Rejected',
      message: `Your book "${bookTitle}" was not approved. Reason: ${reason}`,
      data: { bookId, status: 'rejected', reason }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${authorId}`).emit('book_status', notificationData);
    
    this.loggerService.info('Sent book rejection notification');
  }

  async sendBookBlockedNotification(bookId: number, bookTitle: string, authorId: number, reason: string) {
    const notificationData = {
      bookId,
      bookTitle,
      status: 'blocked',
      reason
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId: authorId,
      type: NotificationType.BOOK_UPDATED,
      title: 'Book Blocked',
      message: `Your book "${bookTitle}" has been blocked. Reason: ${reason}`,
      data: { bookId, status: 'blocked', reason }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto); 

    // Then send via socket.io
    this.server.to(`user-${authorId}`).emit('book_status', notificationData);

    this.loggerService.info('Sent book blocked notification');
  }

  async sendNewPendingReviewToAdmin(bookId: number, bookTitle: string, statusMessage: string, authorId: number) {
    const notificationData = {
      bookId,
      bookTitle
    };

    // Get all admin ids
    const adminIds = await this.userService.findAllAdminAndManagerIds();

    for (const adminId of adminIds) {
      // Skip author
      if (adminId === authorId) continue;
      // Create database notification
    const notificationDto: CreateNotificationDto = {
        userId: adminId,
        type: NotificationType.BOOK_UPDATED,
        title: 'New Pending Review',
        message: statusMessage,
        data: { bookId, bookTitle }
    };
    
      // Save to database first
      await this.notificationService.create(notificationDto);
      // Then send via socket.io
      this.server.to(`user-${adminId}`).emit('book_status', notificationData);
      this.loggerService.info('Sent new pending review to admins');
    }

  }

  // Transaction notifications
  async sendDepositSuccessNotification(userId: number, amount: number, transactionId: string) {
    const notificationData = {
      transactionId,
      amount,
      status: 'success'
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId,
      type: NotificationType.TX_SUCCESS,
      title: 'Deposit Successful',
      message: `Your deposit of ${amount} tokens was successful`,
      data: { transactionId, amount, type: 'deposit' }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${userId}`).emit('tx_deposit', notificationData);
    
    this.loggerService.info('Sent deposit success notification');
  }

  async sendDepositFailedNotification(userId: number, amount: number, transactionId: string, reason: string) {
    const notificationData = {
      transactionId,
      amount,
      status: 'failed',
      reason
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId,
      type: NotificationType.TX_FAILED,
      title: 'Deposit Failed',
      message: `Your deposit of ${amount} tokens failed. Reason: ${reason}`,
      data: { transactionId, amount, type: 'deposit', reason }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${userId}`).emit('tx_deposit', notificationData);
    
    this.loggerService.info('Sent deposit failed notification');
  }

  async sendPurchaseSuccessNotification(userId: number, itemName: string, amount: number, transactionId: string, itemType: 'chapter' | 'book', itemId: number) {
    const notificationData = {
      transactionId,
      itemName,
      itemType,
      itemId,
      amount,
      status: 'success'
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId,
      type: NotificationType.TX_SUCCESS,
      title: 'Purchase Successful',
      message: `Your purchase of ${itemName} for ${amount} tokens was successful`,
      data: { transactionId, itemName, itemType, itemId, amount }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${userId}`).emit('tx_purchase', notificationData);
    
    this.loggerService.info('Sent purchase success notification');
  }

  async sendPurchaseFailedNotification(userId: number, itemName: string, amount: number, transactionId: string, reason: string, itemType: 'chapter' | 'book', itemId: number) {
    const notificationData = {
      transactionId,
      itemName,
      itemType,
      itemId,
      amount,
      status: 'failed',
      reason
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId,
      type: NotificationType.TX_FAILED,
      title: 'Purchase Failed',
      message: `Your purchase of ${itemName} for ${amount} tokens failed. Reason: ${reason}`,
      data: { transactionId, itemName, itemType, itemId, amount, reason }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${userId}`).emit('tx_purchase', notificationData);
    
    this.loggerService.info('Sent purchase failed notification');
  }

  // New chapter notification for followers
  async sendNewChapterNotification(bookId: number, bookTitle: string, chapterTitles: string[], followerIds: number[], authorId: number) {
    const notificationData = {
      bookId,
      bookTitle,
    };

    // Create database notification for each follower first
    for (const followerId of followerIds) {
      // Skip author
      if (followerId === authorId) continue;
      
      const notificationDto: CreateNotificationDto = {
        userId: followerId,
        type: NotificationType.BOOK_CHAPTER_ADDED,
        title: 'New Chapter Available',
        message: `New chapters of the book "${bookTitle}" have just been released: ${chapterTitles.join(', ')}`,
        data: { bookId, bookTitle, chapterTitles }
      };
      
      // Save to database first
      await this.notificationService.create(notificationDto);
      
      // Then send via socket.io
      this.server.to(`user-${followerId}`).emit('chapter_added', notificationData);
    }
    
    this.loggerService.info('Sent new chapter notification to followers');
  }

  // Points earned notification
  async sendPointsEarnedNotification(userId: number, points: number, activityTitle: string, activityType: string) {
    const notificationData = {
      type: NotificationType.POINTS_EARNED,
      points,
      activityTitle,
      activityType
    };

    // Create database notification
    const notificationDto: CreateNotificationDto = {
      userId,
      type: NotificationType.POINTS_EARNED,
      title: 'Points Earned!',
      message: `You earned ${points} points for ${activityTitle}`,
      data: { points, activityTitle, activityType }
    };
    
    // Save to database first
    await this.notificationService.create(notificationDto);
    
    // Then send via socket.io
    this.server.to(`user-${userId}`).emit('points_earned', notificationData);
    
    this.loggerService.info('Sent points earned notification');
  }
} 
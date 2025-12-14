import { LoggerService } from '@core/logger/logger.service';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3002, { cors: true })
export class BookNotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private loggerService: LoggerService) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.loggerService.info('BookNotificationGateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      client.join(`user-${userId}`);
    }
    this.loggerService.warn(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.loggerService.warn(`Client disconnected: ${client.id}`);
  }

  sendNewChapterNotification(userId: number, notificationData: any) {
    this.server.to(`user-${userId}`).emit('new-chapter', notificationData);
    this.loggerService.info('Sent new chapter notification');
  }

  sendBookStatusNotification(userId: number, notificationData: any) {
    this.server.to(`user-${userId}`).emit('book-status', notificationData);
    this.loggerService.info('Sent book status notification');
  }
}

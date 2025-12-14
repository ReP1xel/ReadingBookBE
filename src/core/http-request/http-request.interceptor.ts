import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ERROR_CODES } from './http-request.constants';
import { AxiosError } from 'axios';
import { catchError, Observable } from 'rxjs';
import { ApiResponse } from './http-request.types';
import { map } from 'rxjs/operators';

@Injectable()
export class HttpRequestInterceptor<T> implements NestInterceptor {
  private readonly logger = new Logger(HttpRequestInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        status: true,
        code: 'SUCCESS',
        message: 'Request successful',
        data,
      })),
      catchError((error) => {
        if (error instanceof AxiosError) {
          const { response, config } = error;
          const moduleKey = config?.headers?.['X-Module'] || 'UNKNOWN';
          const errorCode =
            ERROR_CODES[moduleKey]?.[response?.status] || `${moduleKey}500`;

          this.logger.error(
            `🚨 API ERROR: [${moduleKey}] ${errorCode} - ${response?.statusText || 'Unknown error'}`,
          );

          throw new HttpException(
            ERROR_CODES[moduleKey]?.[errorCode] || 'Unknown error occurred',
            response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        throw new HttpException(
          'An unexpected error occurred',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }
}

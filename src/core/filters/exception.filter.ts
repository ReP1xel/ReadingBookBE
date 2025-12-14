import { LoggerService } from '@core/logger/logger.service';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JsonWebTokenError } from 'jsonwebtoken';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorData = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        message = Array.isArray(exceptionResponse['message'])
          ? exceptionResponse['message'][0]
          : exceptionResponse['message'] || message;
        errorData = exceptionResponse['error'] || null;
      }
    } else if (exception instanceof JsonWebTokenError) {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Token không hợp lệ';
      this.logger.err(
        `JWT Error: ${exception.message}`,
        'GlobalExceptionFilter',
      );
    } else {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message || 'An unexpected error occurred';
      this.logger.err(
        `Unexpected Error: ${exception.message}`,
        'GlobalExceptionFilter',
      );
    }

    response.status(status).json({
      status: false,
      code: status,
      data: errorData,
      msg: message,
    });
  }
}

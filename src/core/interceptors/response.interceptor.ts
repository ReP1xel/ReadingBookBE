import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'status' in data &&
          'code' in data &&
          'msg' in data
        ) {
          return data;
        }

        return {
          status: true,
          code: 200,
          data: data !== undefined ? data : null,
          msg: 'Success',
        };
      }),
    );
  }
}

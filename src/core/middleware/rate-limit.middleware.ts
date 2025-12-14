import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 5, // Tối đa 100 request trong 1 phút
    message: { status: 'block', code: 429, message: 'Too many requests' },
    headers: true, // Gửi thông tin rate limit về client
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}

import { redisConfig } from '@core/config/global';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

@Injectable()
export class BanIpMiddleware implements NestMiddleware {
  private redis: Redis;
  private readonly redisHost = redisConfig.host;
  private readonly redisPort = redisConfig.port;
  private readonly redisPassword = redisConfig.password;
  private readonly redisUserName = redisConfig.username;

  constructor() {
    this.redisHost = redisConfig.host;
    this.redisPort = redisConfig.port;
    this.redisPassword = redisConfig.password;
    this.redisUserName = redisConfig.username;

    this.redis = new Redis({
      host: this.redisHost,
      port: this.redisPort,
      username: this.redisUserName,
      password: this.redisPassword,
    });
  }

  private BAN_DURATION = 10 * 60; // Ban IP trong 10 phút
  private MAX_ATTEMPTS = 300; // Nếu quá 300 request trong 5 phút → Ban

  async use(req: Request, res: Response, next: NextFunction) {
    const ip =
      req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!ip) {
      return res.status(400).json({
        status: false,
        code: 'INVALID_IP',
        message: 'Cannot detect IP address',
      });
    }
    const key = `req_count:${ip}`;

    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL is not defined in environment variables');
    }

    // Kiểm tra nếu IP đang bị ban
    const isBanned = await this.redis.get(`banned:${ip}`);
    if (isBanned) {
      return res.status(403).json({
        status: false,
        code: 'IP_BANNED',
        message: 'Your IP is temporarily blocked',
      });
    }

    // Kiểm tra số lần request trong 5 phút
    const reqCount = Number(await this.redis.get(key)) || 0;
    if (reqCount >= this.MAX_ATTEMPTS) {
      await this.redis.set(`banned:${ip}`, '1', 'EX', this.BAN_DURATION);
      return res.status(429).json({
        status: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. You are temporarily blocked',
      });
    }

    // Tăng số lần request
    await this.redis.set(key, Number(reqCount) + 1, 'EX', 300);
    next();
  }
}

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { redisConfig } from '@core/config/global';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
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

  async onModuleInit() {
    console.log('✅ Redis Connected!');
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  // Set Key-Value
  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.redis.set(key, value);
    if (ttl) {
      await this.redis.expire(key, ttl);
    }
  }

  // Get Key-Value
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  // Delete Key
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({ match: pattern });
    stream.on('data', (keys: string[]) => {
      if (keys.length) {
        const pipeline = this.redis.pipeline();
        keys.forEach((key) => {
          pipeline.del(key);
        });
        pipeline.exec();
      }
    });

    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }
}

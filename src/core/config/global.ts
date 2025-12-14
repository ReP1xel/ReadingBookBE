import * as path from 'path';
import { config } from 'dotenv';
import { DataSourceOptions } from 'typeorm';

config({ path: path.join(process.cwd(), 'src', '.env') });
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD || '1234',
};

export const postgresConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5431,
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '1234',
  database: process.env.POSTGRES_DB || 'readingbookonline',
  logging: true,
  synchronize: true,
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET || '',
  expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  expiresInVerify: '5m',
};

export const userConfig = {
  //role: 3 = member
  roleUserId: 3,

  //status: 2 = activate
  statusUserId: 2,

  redisTtlResetPassword: 300,
};

export const bookConfig = {
  // redisBookTtl: 60 * 10,
  redisBookTtl: 1,
};

export const cloudinaryConfig = {
  folderAvatar: 'avatar',
  folderDocument: 'document',
  folderBook: 'book',
  folderBookChapter: 'chapter',
  limitImageSize: 1024 * 1024,
  limitWordSize: 1024 * 1024 * 5,
};

export const openAIConfig = {
  openAIKey: process.env.OPENAI_KEY || '',
};

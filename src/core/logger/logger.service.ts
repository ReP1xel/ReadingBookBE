import { Injectable, Logger } from '@nestjs/common';
import { LOG_LEVELS, IS_DEV } from './logger.constants';

@Injectable()
export class LoggerService {
  private readonly logger = new Logger('AppLogger');

  private logMessage(
    level: keyof typeof LOG_LEVELS,
    message: string,
    context?: string,
  ) {
    const { emoji, color } = LOG_LEVELS[level];
    const logText = `${color}${emoji} [${level}] ${context ? `[${context}]` : ''} ${message}\x1b[0m`;

    if (IS_DEV) {
      console.log(logText);
    }
  }

  info(message: string, context?: string) {
    this.logMessage('INFO', message, context);
  }

  warn(message: string, context?: string) {
    this.logMessage('WARN', message, context);
  }

  err(message: string, context?: string) {
    this.logMessage('ERR', message, context);
  }

  sys(message: string, context?: string) {
    const { emoji, color } = LOG_LEVELS['SYS'];
    const logText = `${color}${emoji} [SYS] ${context ? `[${context}]` : ''} ${message}\x1b[0m`;

    console.log(logText);
  }
}

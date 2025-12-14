export const LOG_LEVELS = {
  INFO: { emoji: 'ℹ️', color: '\x1b[34m' }, // Màu xanh dương
  WARN: { emoji: '⚠️', color: '\x1b[33m' }, // Màu vàng
  ERR: { emoji: '❌', color: '\x1b[31m' }, // Màu đỏ
  SYS: { emoji: '🛠️', color: '\x1b[36m' }, // Màu xanh lơ
};

export const IS_DEV = process.env.NODE_ENV !== 'production';

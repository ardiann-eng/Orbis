// apps/bot-engine/src/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
  // NEVER log sensitive fields
  redact: {
    paths: [
      'keypair',
      'privateKey',
      'encrypted_keypair',
      '*.keypair',
      '*.privateKey',
      'password',
      'authToken',
    ],
    censor: '[REDACTED]',
  },
});

export type Logger = typeof logger;

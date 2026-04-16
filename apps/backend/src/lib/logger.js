import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const transport = isProduction
  ? undefined
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    };

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport,
});

export default logger;

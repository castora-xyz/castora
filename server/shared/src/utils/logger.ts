import pino from 'pino';

if (!process.env.LOGGER_NAME) throw 'Set LOGGER_NAME in env';

export const logger = pino({
  name: process.env.LOGGER_NAME,
  serializers: { bigint: (v) => `${v}` },
  transport: {
    targets: [
      // Pretty console output
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname,name,req,res,responseTime'
        }
      },
      // Google Cloud Logging
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              target: 'cloud-pine',
              options: { logName: process.env.LOGGER_NAME }
            }
          ]
        : [])
    ]
  }
});

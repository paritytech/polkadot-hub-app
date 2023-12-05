import pino from 'pino'

const loggerConfig = {
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      singleLine: true,
    },
  },
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
}

export const log = pino(loggerConfig)

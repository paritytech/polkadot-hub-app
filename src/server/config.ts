import dotenv from 'dotenv'

dotenv.config()

type Env = 'production' | 'development'

type Config = {
  env: Env
  debug: boolean
  skipCronJobs: boolean
  port: number
  appHost: string
  appIcon: string
  logDbQueries: boolean
  databaseUri: string
  jwtSecret: string
  jwtExpiresInDays: number
  oauth2GoogleClientId: string
  oauth2GoogleClientSecret: string
  authMessageToSign: string | undefined
  walletConnectProjectId: string | undefined
  superusers: string[]
  workingHoursTestGroup: string[]
}

const config: Config = {
  env: (process.env.NODE_ENV as Env) || 'development',
  debug: parseBoolean(process.env.DEBUG, true),
  skipCronJobs: parseBoolean(process.env.SKIP_CRON_JOBS, false),
  port: parseInt(process.env.PORT || '') || 3000,
  appHost: process.env.APP_HOST || '',
  appIcon: process.env.APP_ICON || '',
  logDbQueries: parseBoolean(process.env.LOG_DB_QUERIES, false),
  databaseUri: process.env.DATABASE_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresInDays: parseInt(process.env.JWT_EXPIRES_IN_DAYS || '') || 20,
  oauth2GoogleClientId: process.env.OAUTH2_GOOGLE_CLIENT_ID || '',
  oauth2GoogleClientSecret: process.env.OAUTH2_GOOGLE_CLIENT_SECRET || '',
  superusers: JSON.parse(process.env.SUPERUSERS || '[]'),
  authMessageToSign: process.env.AUTH_MESSAGE_TO_SIGN,
  workingHoursTestGroup: JSON.parse(
    process.env.WORKING_HOURS_TEST_GROUP || '[]'
  ),
  walletConnectProjectId: process.env.WALLET_CONNECT_PROJECT_ID,
}

export default config

function parseBoolean(value: string = '', defaultValue = false): boolean {
  if (!value) {
    return defaultValue
  }
  return value.toLowerCase() === 'true'
}

import { CronJob, CronJobContext } from '#server/types'
import { cronJob as fetchTimeOffRequests } from './fetch-time-off-requests'
import { cronJob as fetchPublicHolidays } from './fetch-public-holidays'

module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  return [fetchTimeOffRequests, fetchPublicHolidays]
}

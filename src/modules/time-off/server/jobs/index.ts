import { CronJob, CronJobContext } from '#server/types'
import { cronJob as fetchTimeOffRequests } from './fetch-time-off-requests'

module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  return [fetchTimeOffRequests]
}

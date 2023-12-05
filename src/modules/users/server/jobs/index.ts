import { CronJob, CronJobContext } from '#server/types'
import * as deleteUsersData from './users-delete-users-data'

module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  return [deleteUsersData.jobFactory()]
}

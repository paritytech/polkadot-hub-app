import { CronJob, CronJobContext } from '#server/types'
import * as visitReminder from './visit-reminder'
import * as visitDeleteUserData from './visit-delete-data'

module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  const offices = ctx.appConfig.offices.filter((x) => x.timezone)
  return [
    ...offices.map((office) => visitReminder.jobFactory(office)),
    visitDeleteUserData.jobFactory(),
  ]
}

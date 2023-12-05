import { CronJob, CronJobContext } from '#server/types'
import { cronJob as workingHoursReminderJob } from './working-hours-reminder'
import { cronJob as fetchDefaultWorkingHoursJob } from './fetch-default-working-hours'

// exported as a function for dynamic cron/name generation based on passed argument
module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  return [workingHoursReminderJob, fetchDefaultWorkingHoursJob]
}

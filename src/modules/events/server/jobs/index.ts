import { CronJob, CronJobContext } from '#server/types'
import * as eventChecklistReminder from './event-checklist-reminder'
import * as pullGlobalEvents from './pull-global-events'
import * as deleteUserData from './event-delete-data'

module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  return [
    eventChecklistReminder.cronJob,
    pullGlobalEvents.cronJob,
    deleteUserData.cronJob,
  ]
}

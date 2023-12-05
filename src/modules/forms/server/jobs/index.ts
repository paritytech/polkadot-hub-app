import { CronJob, CronJobContext } from '#server/types'
import * as formsDeleteDate from './forms-delete-data'

module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  return [formsDeleteDate.jobFactory()]
}

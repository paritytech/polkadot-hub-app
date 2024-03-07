import { CronJob, CronJobContext } from '#server/types'
import * as formsDeleteDate from './forms-delete-data'
import * as purgeFormSubmissions from './purge-form-submissions'

module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  return [formsDeleteDate.jobFactory(), purgeFormSubmissions.jobFactory()]
}

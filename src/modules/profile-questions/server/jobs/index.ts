import { CronJob, CronJobContext } from '#server/types'
import * as profileQuestionsDeleteData from './profile-questions-delete-data'

module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  return [profileQuestionsDeleteData.jobFactory()]
}

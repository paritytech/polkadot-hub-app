import { CronJob, CronJobContext } from '#server/types'
import * as checklistAnswerDeleteData from './checklist-answer-delete-data'

module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  return [checklistAnswerDeleteData.jobFactory()]
}

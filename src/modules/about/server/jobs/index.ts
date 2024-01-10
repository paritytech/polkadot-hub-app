import { CronJob, CronJobContext } from '#server/types'
// import * as someCronJob from './someCronJob'

// exported as a function for dynamic cron/name generation based on passed argument
module.exports.moduleCronJobsFactory = (ctx: CronJobContext): CronJob[] => {
  return [
    // {
    //   cron: someCronJob.cron,
    //   name: someCronJob.name,
    //   fn: someCronJob.fn,
    // },
  ]
}

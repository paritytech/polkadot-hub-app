import { Op } from 'sequelize'
import dayjs from 'dayjs'
import { CronJob, CronJobContext } from '#server/types'
import { DATE_FORMAT } from '#server/constants'

const JobName = 'users-delete-users-data'
export const jobFactory = (): CronJob => {
  return {
    cron: '0 1 * * *',
    name: JobName,
    fn: async (ctx: CronJobContext) => {
      try {
        const users = await ctx.models.User.findAllActive({
          where: {
            scheduledToDelete: { [Op.lte]: dayjs().format(DATE_FORMAT) },
          },
        })
        if (!users.length) {
          ctx.log.info(`${JobName}: No one is scheduled to be deleted today.`)
          return
        }
        ctx.log.info(
          `${JobName}: Found ${users.length} users scheduled to be deleted today.`
        )
        for (const user of users) {
          ctx.log.info(
            `${JobName}: Anonymizing ${user.fullName} (email: ${user.email}, id: ${user.id}).`
          )
          await user.anonymize()
          await ctx.models.UserTag.destroy({ where: { userId: user.id } })
        }
      } catch (e) {
        ctx.log.error(JSON.stringify(e))
      }
    },
  }
}

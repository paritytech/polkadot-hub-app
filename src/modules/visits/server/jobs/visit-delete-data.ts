import { CronJob, CronJobContext } from '#server/types'
import dayjs from 'dayjs'
import { Op } from 'sequelize'

const JobName = 'visit-delete-data'
export const jobFactory = (): CronJob => {
  return {
    name: JobName,
    cron: `0 0 * * *`,
    fn: async (ctx: CronJobContext) => {
      try {
        const today = dayjs().format('YYYY-MM-DD')
        const users = await ctx.models.User.findAllActive({
          where: {
            scheduledToDelete: today,
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
          await ctx.models.Visit.destroy({
            where: {
              [Op.and]: [
                { userId: user.id },
                {
                  date: {
                    [Op.gte]: today,
                  },
                },
              ],
            },
          })
          ctx.log.info(
            `${JobName}: Removed future Visit for user ${user.fullName} (id: ${user.id}).`
          )
        }
      } catch (e) {
        ctx.log.error(JSON.stringify(e))
      }
    },
  }
}

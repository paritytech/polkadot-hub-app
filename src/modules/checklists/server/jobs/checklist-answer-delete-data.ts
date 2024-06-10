import dayjs from 'dayjs'
import { Op } from 'sequelize'
import { CronJob, CronJobContext } from '#server/types'

const JobName = 'checklist-answer-delete-data'
export const jobFactory = (): CronJob => {
  return {
    name: JobName,
    cron: `0 0 * * *`,
    fn: async (ctx: CronJobContext) => {
      try {
        const users = await ctx.models.User.findAllActive({
          where: {
            scheduledToDelete: { [Op.lte]: dayjs().format('YYYY-MM-DD') },
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
          await ctx.models.ChecklistAnswer.destroy({
            where: { userId: user.id },
          })

          ctx.log.info(
            `${JobName}: Removed ChecklistAnswer for user ${user.fullName} (id: ${user.id}).`
          )
        }
      } catch (e) {
        ctx.log.error(JSON.stringify(e))
      }
    },
  }
}

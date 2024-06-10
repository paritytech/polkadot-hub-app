import dayjs from 'dayjs'
import { Op } from 'sequelize'
import { CronJob, CronJobContext } from '#server/types'

const JobName = 'checklist-answer-delete-user-data'
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
        ctx.log.info(
          `${JobName}: Found ${users.length} users scheduled to be deleted today.`
        )
        for (const user of users) {
          await ctx.models.ProfileQuestionAnswer.destroy({
            where: { userId: user.id },
          })
          ctx.log.info(
            `${JobName}: Removed ProfileQuestionAnswer for user ${user.fullName} (id: ${user.id}).`
          )
        }
      } catch (e) {
        ctx.log.error(JSON.stringify(e))
      }
    },
  }
}

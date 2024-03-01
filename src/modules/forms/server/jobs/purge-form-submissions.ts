import { Op } from 'sequelize'
import dayjs from 'dayjs'
import { CronJob, CronJobContext } from '#server/types'

const JOB_NAME = 'purge-form-submissions'

export const jobFactory = (): CronJob => {
  return {
    name: JOB_NAME,
    cron: `0 0 * * *`,
    fn: async (ctx: CronJobContext) => {
      const forms = await ctx.models.Form.findAll({
        where: {
          purgeSubmissionsAfterDays: { [Op.ne]: null },
        },
        attributes: ['id', 'title', 'purgeSubmissionsAfterDays'],
      })
      for (const form of forms) {
        if (!form.purgeSubmissionsAfterDays) continue
        const deleted = await ctx.models.FormSubmission.destroy({
          where: {
            formId: form.id,
            createdAt: {
              [Op.lt]: dayjs()
                .subtract(form.purgeSubmissionsAfterDays, 'day')
                .toDate(),
            },
          },
        })
        if (deleted) {
          ctx.log.info(
            `${JOB_NAME}: Deleted ${deleted} submissions. Form "${form.title}"`
          )
        }
      }
    },
  }
}

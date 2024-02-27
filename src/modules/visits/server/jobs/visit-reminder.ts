import dayjs from 'dayjs'
import { Op } from 'sequelize'
import { CronJob, CronJobContext } from '#server/types'
import { Office } from '#server/app-config/types'
import { getUtcHourForTimezone } from '#server/utils'
import { DATE_FORMAT } from '#server/constants'
import { appConfig } from '#server/app-config'
import config from '#server/config'

const REMINDER_HOUR_LOCAL = 8 // send notifications at 8AM

export const jobFactory = (office: Office): CronJob => {
  const jobReminderHour = office.timezone
    ? getUtcHourForTimezone(REMINDER_HOUR_LOCAL, office.timezone)
    : REMINDER_HOUR_LOCAL
  return {
    name: `visit-reminder:${office.id}`,
    cron: `*/10 ${jobReminderHour} * * *`, // every 10th minute past hour `REMINDER_HOUR_LOCAL` (local time)
    fn: async (ctx: CronJobContext) => {
      const officeId = office.id
      const date = dayjs().format(DATE_FORMAT)

      // fetch all reminders that were sent in the last 2 hours
      const performedReminders = await ctx.models.VisitReminderJob.findAll({
        where: {
          failed: false,
          createdAt: { [Op.gt]: dayjs().subtract(2, 'hour').toDate() },
        },
        attributes: ['id', 'visitId'],
      })

      // fetch all visits that have not yet been reminded about
      const visitsWhereQuery: Record<string, any> = {
        status: 'confirmed',
        date,
        officeId,
      }
      if (performedReminders.length) {
        // `{ where: { id: [Op.notIn]: [] } }` doesn't return any results
        visitsWhereQuery['id'] = {
          [Op.notIn]: performedReminders.map((x) => x.visitId),
        }
      }
      const visits = await ctx.models.Visit.findAll({ where: visitsWhereQuery })
      if (!visits.length) {
        ctx.log.info(
          `Skipped. No visits to remind about for today in "${office.id}" office`
        )
        return
      }

      // fetch users
      const users = await ctx.models.User.findAllActive({
        where: {
          id: { [Op.in]: visits.map((x) => x.userId) },
        },
      })
      const userByVisitId = visits.reduce(
        (acc, x) => {
          const user = users.find((u) => u.id === x.userId)
          return user
            ? {
                ...acc,
                [x.id]: user,
              }
            : acc
        },
        // FIXME: use globally defined `User` model type instead of 'any'
        {} as Record<string, any>
      )

      let succeedReminders = 0
      let failedReminders = 0
      for (const visit of visits) {
        const user = userByVisitId[visit.id]
        if (!user) {
          ctx.log.warn(`Can't find a user for visit ${visit.id}`)
          continue
        }

        const message = appConfig.templates.notification(
          'visits',
          'visitReminderCron',
          {
            visitUrl: `${config.appHost}/visits/${visit.id}`,
            office: { id: officeId },
          }
        )
        if (message) {
          try {
            await ctx.integrations.Matrix.sendMessageToUser(user, message)
            succeedReminders++
          } catch (err) {
            ctx.log.error(
              err,
              `Cant send matrix notification to user ${user.id}`
            )
            await ctx.models.VisitReminderJob.create({
              officeId,
              userId: user.id,
              visitId: visit.id,
              failed: true,
              metadata: { error: JSON.stringify(err) },
            })
            failedReminders++
            continue
          }
        } else {
          ctx.log.error('Failed to compile a message from template')
          failedReminders++
        }

        await ctx.models.VisitReminderJob.create({
          officeId,
          userId: user.id,
          visitId: visit.id,
        })
      }
      if (succeedReminders || failedReminders) {
        ctx.log.info(
          `Succesfully sent ${succeedReminders} reminders in "${officeId}" office.${
            failedReminders ? ` ${failedReminders} failed.` : ''
          }`
        )
      }
    },
  }
}

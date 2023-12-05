import dayjs from 'dayjs'
import { Op } from 'sequelize'
import { marked } from 'marked'
import { CronJob, CronJobContext } from '#server/types'
import config from '#server/config'
import { appConfig } from '#server/app-config'
import { EntityVisibility } from '#shared/types'
import {
  getUserEventChecklists,
  UserCheckboxCompletion,
  UserChecklistCompletion,
} from '../helpers/checklists'

const WORKING_HOURS = [9, 20]

export const cronJob: CronJob = {
  name: 'event-checklist-reminder',
  cron: '10 * * * TUE', // every hour at XX:10 on Tuesday
  fn: async (ctx: CronJobContext) => {
    const events = await ctx.models.Event.findAll({
      where: {
        visibility: {
          [Op.in]: [EntityVisibility.Visible, EntityVisibility.Url],
        },
        startDate: {
          [Op.gte]: dayjs().add(1, 'day').toDate(),
        },
        endDate: {
          [Op.gte]: new Date(),
        },
      },
    })

    for (const event of events) {
      if (!event.checklist.length) {
        continue // TODO: move this condition in the db query
      }

      const userChecklists: UserChecklistCompletion[] =
        await getUserEventChecklists(ctx.sequelize, event)
      const users = await ctx.models.User.findAllActive({
        where: { id: { [Op.in]: userChecklists.map((x) => x.userId) } },
      })

      // filter those who has a timezone & their loca time is out of WORKING_HOURS range
      const now = dayjs()
      let usersToNotify = users.filter((user) => {
        if (user.geodata?.timezone) {
          const localTime = now.tz(user.geodata.timezone)
          const localTimeHour = localTime.hour()
          if (
            localTimeHour < WORKING_HOURS[0] ||
            localTimeHour > WORKING_HOURS[1]
          ) {
            return false
          }
        }
        return true
      })

      // fetch all reminders that were sent in the last 24 hours
      const performedReminders =
        await ctx.models.EventChecklistReminderJob.findAll({
          where: {
            failed: false,
            eventId: event.id,
            userId: { [Op.in]: usersToNotify.map((x) => x.id) },
            createdAt: { [Op.gt]: dayjs().subtract(24, 'hour').toDate() },
          },
          attributes: ['id', 'userId'],
        })

      // filter those who has received a reminder already
      const performedReminderUserIds = performedReminders.map((x) => x.userId)
      usersToNotify = usersToNotify.filter(
        (x) => !performedReminderUserIds.includes(x.id)
      )

      // fetch event applications and filter those who has applied in less than 24 hours
      const applications = await ctx.models.EventApplication.findAll({
        where: {
          eventId: event.id,
          userId: { [Op.in]: usersToNotify.map((x) => x.id) },
          status: 'confirmed',
          createdAt: { [Op.lt]: now.subtract(1, 'day').toDate() },
        },
      })
      const applicationUserIds = applications.map((x) => x.userId)
      usersToNotify = usersToNotify.filter((x) =>
        applicationUserIds.includes(x.id)
      )

      // prepare checklists data
      const checklistByUserIds = userChecklists.reduce((acc, x) => {
        const record = { ...x } as UserCheckboxCompletion & { userId?: string }
        delete record['userId']
        return { ...acc, [x.userId]: record }
      }, {} as Record<string, UserCheckboxCompletion>)

      // prepare checkboxes texts
      const checkboxTextByIds = event.checklist.reduce(
        // convert inline markdown to html
        (acc, x) => ({ ...acc, [x.id]: marked.parseInline(x.text) }),
        {} as Record<string, string>
      )

      let succeedReminders = 0
      let failedReminders = 0
      for (const user of usersToNotify) {
        const userChecklist = checklistByUserIds[user.id]
        const checkboxTexts = Object.keys(userChecklist)
          .map((chId) => ({
            id: chId,
            completed: !Number(userChecklist[chId]),
          }))
          .filter((ch) => ch.completed)
          .map((ch) => checkboxTextByIds[ch.id])

        const message = appConfig.templates.notification(
          'events',
          'eventChecklistReminder',
          {
            user: user.usePublicProfileView(),
            event: {
              title: event.title,
              url: `${config.appHost}/event/${event.id}`,
            },
            remainingTasks: checkboxTexts.join(', '),
          }
        )
        if (message) {
          try {
            await ctx.integrations.Matrix.sendMessageToUser(user, message)
            succeedReminders++
          } catch (err: unknown) {
            ctx.log.error(JSON.stringify(err?.message))
            ctx.log.error(
              err,
              `Cant send matrix notification to user ${user.id}`
            )
            await ctx.models.EventChecklistReminderJob.create({
              userId: user.id,
              eventId: event.id,
              failed: true,
              metadata: { error: JSON.stringify(err) },
            })
            failedReminders++
            continue
          }
        }

        await ctx.models.EventChecklistReminderJob.create({
          userId: user.id,
          eventId: event.id,
        })
      }
      if (succeedReminders || failedReminders) {
        ctx.log.info(
          `Succesfully sent ${succeedReminders} reminders for "${
            event.title
          }" event.${failedReminders ? ` ${failedReminders} failed.` : ''}`
        )
      }
    }
  },
}

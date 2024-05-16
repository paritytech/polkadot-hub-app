import { CronJob, CronJobContext } from '#server/types'
import dayjs from 'dayjs'
import { Op } from 'sequelize'
import { appConfig } from '#server/app-config'
import config from '#server/config'
import { Event, EventApplication } from '#shared/types'

const JobName = 'event-delete-data'
export const cronJob: CronJob = {
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
        `${JobName}: Found ${users.length} users scheduled to be deleted today `
      )
      const today = dayjs().utc().startOf('day').toDate()
      for (const user of users) {
        const futureEventApplications =
          (await ctx.models.EventApplication.findAll({
            where: { userId: user.id },
            attributes: ['id', 'eventId'],
            include: [
              {
                model: ctx.models.Event,
                where: { startDate: { [Op.gte]: today } },
                attributes: ['title', 'id', 'responsibleUserIds'],
                required: true,
              },
            ],
          })) as unknown as Array<
            EventApplication & {
              Event: Pick<Event, 'title' | 'id' | 'responsibleUserIds'>
            }
          >
        if (futureEventApplications.length) {
          ctx.log.info(
            `${JobName}: User ${user.id} ${user.fullName} has ${futureEventApplications.length} future event applications. `
          )

          // Notifications for the users who are responsible for the event

          if (ctx.integrations.EmailSMTP) {
            for (let item in futureEventApplications) {
              const eventApplication = futureEventApplications[item]
              const event = eventApplication.Event
              const responsibleUsers = await ctx.models.User.findAllActive({
                where: {
                  id: {
                    [Op.in]: event.responsibleUserIds,
                  },
                },
              })

              const emailMessage = appConfig.templates.email(
                'events',
                'eventApplicationDeleted',
                {
                  user: user.usePublicProfileView(),
                  appName: appConfig.config.application.name,
                  event: {
                    url: `${config.appHost}/event/${event.id}`,
                    title: event.title,
                    applicationsUrl: `${config.appHost}/admin/events/${event.id}/applications`,
                  },
                }
              )
              if (emailMessage?.html) {
                for (const responsibleUser of responsibleUsers) {
                  try {
                    await ctx.integrations.EmailSMTP.sendEmail({
                      to: responsibleUser.email,
                      html: emailMessage.html,
                      subject: emailMessage.subject,
                    })
                  } catch (err) {
                    ctx.log.error(
                      `${JobName}: Can't send event application deleted email notification for ${responsibleUser.email}`
                    )
                  }
                }
              }
            }
          }

          // Removing Event Applications and Event Checkmarks
          let futureEventsIds: Array<string> = []
          let eventApplicationIds: Array<string> = []

          futureEventApplications.forEach((one) => {
            futureEventsIds.push(one.eventId)
            eventApplicationIds.push(one.id)
          })

          await ctx.models.EventApplication.destroy({
            where: { id: { [Op.in]: eventApplicationIds } },
          })

          await ctx.models.EventCheckmark.destroy({
            where: { eventId: { [Op.in]: futureEventsIds }, userId: user.id },
          })

          ctx.log.info(`${JobName}: Removed application and checkmarks. `)
        }
      }
    } catch (e) {
      ctx.log.error(JSON.stringify(e))
    }
  },
}

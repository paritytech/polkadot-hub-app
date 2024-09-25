import { Op, fn, col } from 'sequelize'
import dayjs, { Dayjs } from 'dayjs'
import config from '#server/config'
import { CronJob, CronJobContext } from '#server/types'
import * as fp from '#shared/utils/fp'
import { TimeOffRequestStatus, WorkingHoursConfig } from '#shared/types'
import { DATE_FORMAT } from '#server/constants'
import { Metadata } from '../../metadata-schema'

export const cronJob: CronJob = {
  name: 'working-hours-reminder',
  cron: '0 17 * * 1-5', // every weekday at 17:00 UTC
  fn: async (ctx: CronJobContext) => {
    if (!ctx.integrations.Matrix) {
      ctx.log.error(
        'Cannot send working hours reminders: disabled Matrix integration.'
      )
      return
    }
    const moduleMetadata = ctx.appConfig.getModuleMetadata(
      'working-hours'
    ) as Metadata
    const configByRole = moduleMetadata?.configByRole as Record<
      string,
      WorkingHoursConfig
    >
    const allowedRoles = Object.keys(configByRole)

    const lastWorkingDay = getPreviousWeekday()
    const today = dayjs()

    const ignoreDates = [lastWorkingDay, today].map((x) =>
      x.format(DATE_FORMAT)
    )
    const timeOffUserIds = await ctx.models.TimeOffRequest.findAll({
      where: {
        status: TimeOffRequestStatus.Approved,
        dates: { [Op.overlap]: ignoreDates },
      },
      attributes: ['userId'],
    }).then(fp.map(fp.prop('userId')))

    const publicHolidays = await ctx.models.PublicHoliday.findAll({
      where: {
        date: { [Op.in]: ignoreDates },
      },
    })
    const publicHolidaysCalendarIdsToExclude = Array.from(
      new Set(publicHolidays.map(fp.prop('calendarId')))
    )

    const recentEntriesUserIds = await ctx.models.WorkingHoursEntry.findAll({
      where: {
        userId: { [Op.notIn]: timeOffUserIds },
        date: lastWorkingDay.format(DATE_FORMAT),
      },
      attributes: [[fn('DISTINCT', col('userId')), 'userId']],
      raw: true,
    }).then(fp.map(fp.prop('userId')))

    const excludedUserIds = Array.from(
      new Set([...timeOffUserIds, ...recentEntriesUserIds])
    )
    const users = await ctx.models.User.findAllActive({
      where: {
        id: { [Op.notIn]: excludedUserIds },
        roles: { [Op.overlap]: allowedRoles },
        isInitialised: true,
      },
    })

    const message = ctx.appConfig.templates.notification(
      'working-hours',
      'unfilledWorkingHours',
      {
        lastWorkingDate: lastWorkingDay.format('dddd, MMMM D'),
        url: `${config.appHost}/working-hours#${lastWorkingDay.format(
          DATE_FORMAT
        )}`,
      }
    )

    if (!message) {
      ctx.log.error(
        `Cannot send working hours reminders. Missing notification template.`
      )
      return
    }

    const report = { succeeded: 0, failed: 0 }
    for (const user of users) {
      const userRole = user.roles.find((x) => allowedRoles.includes(x))
      const config = configByRole[userRole || '']
      if (!config) continue
      if (
        config.publicHolidayCalendarId &&
        publicHolidaysCalendarIdsToExclude.includes(
          config.publicHolidayCalendarId
        )
      ) {
        ctx.log.info(`Skipping user ${user.email} due to public holiday`)
        continue
      }
      const response = await ctx.integrations.Matrix.sendMessageToUser(
        user,
        message
      )
      if (response.success) {
        report.succeeded++
        ctx.log.info(`Sent Matrix notification to ${user.email}`)
      } else {
        ctx.log.error(
          response.error,
          `Failed to send Matrix notification ${user.email}`
        )
        report.failed++
      }
    }

    if (report.succeeded || report.failed) {
      ctx.log.info(
        `Successfully sent ${report.succeeded} working time reminders. ${report.failed} failed.`
      )
    }
  },
}

function getPreviousWeekday(): Dayjs {
  const today = dayjs().startOf('day')
  const dayIndex = today.day()
  if (dayIndex === 1) {
    return today.subtract(3, 'day')
  } else if (dayIndex === 0) {
    return today.subtract(2, 'day')
  } else {
    return today.subtract(1, 'day')
  }
}

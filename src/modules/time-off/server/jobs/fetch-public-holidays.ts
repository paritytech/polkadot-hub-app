import dayjs from 'dayjs'
import { Op } from 'sequelize'
import { CronJob, CronJobContext } from '#server/types'
import { DATE_FORMAT } from '#server/constants'
import * as fp from '#shared/utils/fp'
import { Metadata } from '../../metadata-schema'

export const cronJob: CronJob = {
  name: 'fetch-public-holidays',
  cron: '0 5 * * MON', // every Monday at 5AM
  fn: async (ctx: CronJobContext) => {
    if (ctx.integrations.Humaans) {
      await fetchHumaansPublicHolidays(ctx)
    }
  },
}

async function fetchHumaansPublicHolidays(ctx: CronJobContext) {
  const metadata = ctx.appConfig.getModuleMetadata('time-off') as Metadata
  const calendarIds = metadata?.publicHolidayCalendarExternalIds || []
  if (calendarIds.length === 0) {
    return
  }

  const period = [
    dayjs().startOf('year').format(DATE_FORMAT),
    dayjs().add(1, 'year').endOf('year').format(DATE_FORMAT),
  ]

  for (const calendarId of calendarIds) {
    const exisingPublicHolidays = await ctx.models.PublicHoliday.findAll({
      where: {
        calendarId,
        date: {
          [Op.gte]: period[0],
          [Op.lte]: period[1],
        },
      },
    })
    const exisingPublicHolidaysByDate = exisingPublicHolidays.reduce(
      fp.by('date'),
      {}
    )
    const holidays = await ctx.integrations.Humaans.getPublicHolidays(
      period[0],
      period[1],
      calendarId
    ).then((xs) =>
      xs.map((x) => ({
        date: x.date,
        name: x.name,
        calendarId,
        externalIds: {
          humaansId: x.id,
        },
      }))
    )

    let createdRecords = 0
    for (const holiday of holidays) {
      const existingRecord = exisingPublicHolidaysByDate[holiday.date]
      if (!existingRecord) {
        await ctx.models.PublicHoliday.create(holiday)
        createdRecords++
      }
      // TODO: process removed public holidays
    }
    if (createdRecords) {
      ctx.log.info(
        `Created ${createdRecords} public holidays for calendar ${calendarId}.`
      )
    }
  }
}

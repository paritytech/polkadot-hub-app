import dayjs from 'dayjs'
import { Op } from 'sequelize'
import { CronJob, CronJobContext } from '#server/types'
import { DATE_FORMAT } from '#server/constants'
import * as fp from '#shared/utils/fp'
import {
  TimeOffRequestStatus,
  TimeOffRequestUnit,
  TimeOffRequest,
} from '#shared/types'
import { Metadata } from '../../metadata-schema'

export const cronJob: CronJob = {
  name: 'fetch-time-off-requests',
  cron: '0 20 * * *', // daily at 8PM
  fn: async (ctx: CronJobContext) => {
    if (ctx.integrations.Humaans) {
      await fetchHumaansTimeAways(ctx)
    } else if (ctx.integrations.BambooHR) {
      await fetchBamboHRTimeOffRequests(ctx)
    }
  },
}

const INTERVAL_DAYS = 28

async function fetchBamboHRTimeOffRequests(ctx: CronJobContext) {
  const STATUS_MAP = {
    approved: TimeOffRequestStatus.Approved,
    denied: TimeOffRequestStatus.Rejected,
    superceded: TimeOffRequestStatus.Cancelled,
    requested: TimeOffRequestStatus.Open,
    canceled: TimeOffRequestStatus.Cancelled,
  } as Record<string, TimeOffRequestStatus>

  const interval = [
    dayjs().format(DATE_FORMAT),
    dayjs().add(INTERVAL_DAYS, 'day').format(DATE_FORMAT),
  ]
  const requests = await ctx.integrations.BambooHR.getTimeOffRequests({
    startDate: interval[0],
    endDate: interval[1],
  })

  const employees = await ctx.integrations.BambooHR.getEmployees()
  const employeesById = employees
    .filter(fp.prop('id'))
    .reduce<Record<string, (typeof employees)[0]>>(fp.by('id'), {})

  const userEmails = requests
    .map((x) => {
      const employee = employeesById[x.employeeId]
      return employee?.workEmail || ''
    })
    .filter(Boolean)
    .reduce(fp.uniq, [] as string[])
  const users = await ctx.models.User.findAll({
    where: { email: { [Op.in]: userEmails } },
  })
  const usersByEmail = users.reduce(fp.by('email'), {})
  const externalIds = requests.map(fp.prop('id'))

  const currentTimeOffRequests = await ctx.models.TimeOffRequest.findAll({
    where: {
      'externalIds.bamboohr': { [Op.in]: externalIds },
    },
  })
  const currentTimeOffRequestsByExternalId = currentTimeOffRequests.reduce<
    Record<string, (typeof currentTimeOffRequests)[0]>
  >((acc, x) => {
    return x.externalIds.bamboohr
      ? { ...acc, [x.externalIds.bamboohr]: x }
      : acc
  }, {})

  const report = { succeeded: 0, failed: 0 }
  for (const request of requests) {
    try {
      const employee = employeesById[request.employeeId]
      if (!employee) {
        continue
      }
      const user = usersByEmail[employee.workEmail]
      if (!user) {
        continue
      }
      const timeOffDetails = getTimeOffDetails(request)
      const status = STATUS_MAP[request.status.status]
      const currentRequest = currentTimeOffRequestsByExternalId[request.id]
      if (currentRequest) {
        // update
        if (
          status !== currentRequest.status ||
          currentRequest.startDate !== request.start ||
          currentRequest.endDate !== request.end
        ) {
          await currentRequest
            .set({
              status,
              startDate: request.start,
              endDate: request.end,
              unit: timeOffDetails.unit,
              dates: timeOffDetails.dates,
            })
            .save()
        }
        report.succeeded++
        continue
      }
      // create
      await ctx.models.TimeOffRequest.create({
        status,
        unit: timeOffDetails.unit,
        dates: timeOffDetails.dates,
        unitsPerDay: timeOffDetails.unitsPerDay,
        startDate: request.start,
        endDate: request.end,
        userId: user.id,
        externalIds: { bamboohr: request.id },
      })
      report.succeeded++
    } catch (err) {
      ctx.log.error(
        err,
        `Failed to create/update time-off request. External id: ${request.id}.`
      )
      report.failed++
    }
  }

  if (report.succeeded || report.failed) {
    ctx.log.info(
      `Successfully created/updated ${report.succeeded} time-off requests. ${report.failed} failed.`
    )
  }

  // helpers
  function getTimeOffDetails(
    request: (typeof requests)[0]
  ): Pick<TimeOffRequest, 'dates' | 'unitsPerDay' | 'unit'> {
    let unit
    if (request.amount.unit === 'days') {
      unit = TimeOffRequestUnit.Day
    } else if (request.amount.unit === 'hours') {
      unit = TimeOffRequestUnit.Hour
    } else {
      throw new Error(`Unsupported request unit (${request.amount.unit})`)
    }
    const dates: TimeOffRequest['dates'] = []
    const unitsPerDay: TimeOffRequest['unitsPerDay'] = {}
    for (const date in request.dates) {
      const value = Number(request.dates[date])
      if (value) {
        dates.push(date)
        unitsPerDay[date] = value
      }
    }
    return { dates, unit, unitsPerDay }
  }
}

async function fetchHumaansTimeAways(ctx: CronJobContext) {
  const STATUS_MAP = {
    pending: TimeOffRequestStatus.Open,
    approved: TimeOffRequestStatus.Approved,
    declined: TimeOffRequestStatus.Rejected,
  } as Record<string, TimeOffRequestStatus>

  const metadata = ctx.appConfig.getModuleMetadata('time-off') as Metadata
  const excludedTypes = metadata.excludeTimeOffTypes

  const interval = [
    dayjs().format(DATE_FORMAT),
    dayjs().add(INTERVAL_DAYS, 'day').format(DATE_FORMAT),
  ]
  const requests = await ctx.integrations.Humaans.getTimeAways(
    interval[0],
    interval[1]
  ).then((xs) =>
    xs.filter((x) => x.isTimeOff && !excludedTypes.includes(x.timeAwayTypeId))
  )

  if (!requests.length) {
    ctx.log.info('No time aways found in the specified interval')
    return
  }

  const employees = await ctx.integrations.Humaans.getEmployees()
  const employeesById = employees
    .filter(fp.prop('id'))
    .reduce<Record<string, (typeof employees)[0]>>(fp.by('id'), {})

  const userEmails = requests
    .map((x) => {
      const employee = employeesById[x.personId]
      return employee?.email || ''
    })
    .filter(Boolean)
    .reduce(fp.uniq, [] as string[])
  const users = await ctx.models.User.findAll({
    where: { email: { [Op.in]: userEmails } },
  })
  const usersByEmail = users.reduce(fp.by('email'), {})
  const externalIds = requests.map(fp.prop('id'))

  const currentTimeOffRequests = await ctx.models.TimeOffRequest.findAll({
    where: {
      'externalIds.humaans': { [Op.in]: externalIds },
    },
  })
  const currentTimeOffRequestsByExternalId = currentTimeOffRequests.reduce<
    Record<string, (typeof currentTimeOffRequests)[0]>
  >((acc, x) => {
    return x.externalIds.humaans ? { ...acc, [x.externalIds.humaans]: x } : acc
  }, {})

  const report = { succeeded: 0, failed: 0 }
  for (const request of requests) {
    try {
      const employee = employeesById[request.personId]
      if (!employee) {
        continue
      }
      const user = usersByEmail[employee.email]
      if (!user) {
        continue
      }
      const timeOffDetails = getTimeOffDetails(request)
      const status = STATUS_MAP[request.requestStatus]
      const currentRequest = currentTimeOffRequestsByExternalId[request.id]
      if (currentRequest) {
        // update
        const hasChanged = Object.keys(timeOffDetails.unitsPerDay).some(
          (date) => {
            return (
              timeOffDetails.unitsPerDay[date] !==
              currentRequest.unitsPerDay[date]
            )
          }
        )
        if (status !== currentRequest.status || hasChanged) {
          await currentRequest
            .set({
              status,
              startDate: request.startDate,
              endDate: request.endDate,
              unit: timeOffDetails.unit,
              dates: timeOffDetails.dates,
              unitsPerDay: timeOffDetails.unitsPerDay,
            })
            .save()
          ctx.log.info(`Updated time-off request for user ${user.email}`)
          report.succeeded++
        }
        continue
      }
      // create
      await ctx.models.TimeOffRequest.create({
        status,
        unit: timeOffDetails.unit,
        dates: timeOffDetails.dates,
        unitsPerDay: timeOffDetails.unitsPerDay,
        startDate: request.startDate,
        endDate: request.endDate,
        userId: user.id,
        externalIds: { humaans: request.id },
      })
      ctx.log.info(`Created a new time-off request for user ${user.email}`)
      report.succeeded++
    } catch (err) {
      ctx.log.error(
        err,
        `Failed to create/update time-off request. External id: ${request.id}.`
      )
      report.failed++
    }
  }

  if (report.succeeded || report.failed) {
    ctx.log.info(
      `Successfully created/updated ${report.succeeded} time-off requests. ${report.failed} failed.`
    )
  }

  // helpers
  function getTimeOffDetails(
    request: (typeof requests)[0]
  ): Pick<TimeOffRequest, 'dates' | 'unitsPerDay' | 'unit'> {
    const dates: TimeOffRequest['dates'] = []
    const unitsPerDay: TimeOffRequest['unitsPerDay'] = {}
    for (const day of request.breakdown) {
      if (!day.holiday && !day.weekend) {
        dates.push(day.date)
        unitsPerDay[day.date] = day.period === 'full' ? 1 : 0.5
      }
    }
    return {
      unit: TimeOffRequestUnit.Day,
      dates,
      unitsPerDay,
    }
  }
}

import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Op, WhereOptions } from 'sequelize'
import dayjs, { Dayjs } from 'dayjs'
import dayjsIsoWeek from 'dayjs/plugin/isoWeek'
import csvParser from 'papaparse'
import {
  User,
  DefaultWorkingHoursEntry,
  DefaultWorkingHoursEntryCreationRequest,
  DefaultWorkingHoursEntryUpdateRequest,
  TimeOffRequest,
  TimeOffRequestStatus,
  WorkingHoursConfig,
  WorkingHoursEntry,
  WorkingHoursEntryCreationRequest,
  WorkingHoursEntryUpdateRequest,
  TimeOffRequestUnit,
  PublicHoliday,
} from '#shared/types'
import config from '#server/config'
import { appConfig } from '#server/app-config'
import { DATE_FORMAT } from '#server/constants'
import { by, groupBy, prop, sortWith, omit, map } from '#shared/utils/fp'
import * as fp from '#shared/utils/fp'
import { Permissions } from '../permissions'
import {
  getModuleRoleConfig,
  validateDayEntries,
  validateEntry,
} from './helpers'
import {
  calculateOverwork,
  calculateTotalPublicHolidaysTime,
  calculateTotalTimeOffTime,
  calculateTotalWorkingHours,
  getDateRangeEdges,
  getDurationString,
  getExactHours,
  getIntervalDates,
  getIntervalWeeks,
  getTimeOffByDate,
  getWeekIndexesRange,
  sumTime,
} from '../shared-helpers'
import { Metadata } from '../metadata-schema'
import { WorkingHoursUserConfig } from './models'

dayjs.extend(dayjsIsoWeek)

function isOutOfTestGroup(user: User): boolean {
  return !config.workingHoursTestGroup.includes(user.email)
}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get('/config', async (req: FastifyRequest, reply) => {
    if (!req.can(Permissions.Create)) {
      return null
    }
    if (isOutOfTestGroup(req.user)) {
      return null
    }
    const metadata = appConfig.getModuleMetadata('working-hours') as Metadata
    if (!metadata) return null

    const allowedRoles = Object.keys(metadata.configByRole)
    const userRole = req.user.roles.find((x) => allowedRoles.includes(x))
    if (!userRole) return null

    const roleConfig = metadata.configByRole[userRole] || null
    if (!roleConfig) return null
    const result: WorkingHoursConfig = {
      ...roleConfig,
      personalDefaultEntries: [],
    }

    const defaultEntries = await fastify.db.DefaultWorkingHoursEntry.findAll({
      where: { userId: req.user.id },
    })
    if (result && defaultEntries.length) {
      result.personalDefaultEntries = defaultEntries.map((x) => [
        x.startTime,
        x.endTime,
      ])
    }
    return result
  })

  fastify.get(
    '/entries',
    async (
      req: FastifyRequest<{
        Querystring: { startDate: string; endDate: string }
      }>,
      reply
    ) => {
      req.check(Permissions.Create)
      if (isOutOfTestGroup(req.user)) {
        return reply.throw.accessDenied()
      }
      const entries = await fastify.db.WorkingHoursEntry.findAll({
        where: {
          userId: req.user.id,
          date: {
            [Op.gte]: req.query.startDate,
            [Op.lte]: req.query.endDate,
          },
        },
        order: ['date'],
      })
      return reply.send(entries)
    }
  )

  fastify.get(
    '/time-off-requests',
    async (
      req: FastifyRequest<{
        Querystring: { startDate: string; endDate: string }
      }>,
      reply
    ) => {
      req.check(Permissions.Create)
      if (isOutOfTestGroup(req.user)) {
        return reply.throw.accessDenied()
      }
      const startDate = dayjs(req.query.startDate, DATE_FORMAT)
      const endDate = dayjs(req.query.endDate, DATE_FORMAT)
      const requests = await fastify.db.TimeOffRequest.findAll({
        where: {
          userId: req.user.id,
          dates: { [Op.overlap]: getIntervalDates(startDate, endDate) },
          status: TimeOffRequestStatus.Approved,
        },
      })
      return requests
    }
  )

  fastify.get(
    '/public-holidays',
    async (
      req: FastifyRequest<{
        Querystring: { startDate: string; endDate: string }
      }>,
      reply
    ) => {
      req.check(Permissions.Create)
      if (isOutOfTestGroup(req.user)) {
        return reply.throw.accessDenied()
      }
      const roleConfig = getModuleRoleConfig(req.user.roles, appConfig)
      if (!roleConfig) return []
      const calendarId = roleConfig.publicHolidayCalendarId
      if (!calendarId) return []

      const holidays = await fastify.db.PublicHoliday.findAll({
        where: {
          calendarId,
          date: {
            [Op.gte]: req.query.startDate,
            [Op.lte]: req.query.endDate,
          },
        },
      })
      return holidays
    }
  )

  fastify.post(
    '/entries',
    async (
      req: FastifyRequest<{ Body: WorkingHoursEntryCreationRequest[] }>,
      reply
    ) => {
      req.check(Permissions.Create)
      if (isOutOfTestGroup(req.user)) {
        return reply.throw.accessDenied()
      }
      const newEntries: Array<
        Omit<WorkingHoursEntry, 'id' | 'createdAt' | 'updatedAt'>
      > = req.body.map((x) => ({ ...x, userId: req.user.id }))
      let error: string | null = null

      // validate each entry
      newEntries.some((x) => {
        error = validateEntry(x)
        return !!error
      })
      if (error) {
        return reply.throw.badParams(error)
      }

      // validate entries set for each day
      const newEntriesByDate = newEntries.reduce(groupBy('date'), {})
      const existingEntries = await fastify.db.WorkingHoursEntry.findAll({
        where: {
          date: { [Op.in]: Object.keys(newEntriesByDate) },
          userId: req.user.id,
        },
      })
      const existingEntriesByDate = existingEntries.reduce(groupBy('date'), {})
      for (const date in newEntriesByDate) {
        const newDayEntries = newEntriesByDate[date] || []
        const existingDayEntries = existingEntriesByDate[date] || []
        const mergedDayEntries = newDayEntries.concat(existingDayEntries)
        error = validateDayEntries(mergedDayEntries)
        if (error) {
          break
        }
      }
      if (error) {
        return reply.throw.conflict(error)
      }

      // save new entries
      await fastify.db.WorkingHoursEntry.bulkCreate(newEntries)
      return reply.status(200).send(newEntries.length)
    }
  )

  fastify.delete(
    '/entries/:entryId',
    async (req: FastifyRequest<{ Params: { entryId: string } }>, reply) => {
      req.check(Permissions.Create)
      const entry = await fastify.db.WorkingHoursEntry.findOne({
        where: {
          userId: req.user.id,
          id: req.params.entryId,
        },
      })
      if (!entry) {
        return reply.throw.notFound()
      }
      await entry.destroy()
      return reply.ok()
    }
  )

  fastify.put(
    '/entries/:entryId',
    async (
      req: FastifyRequest<{
        Params: { entryId: string }
        Body: WorkingHoursEntryUpdateRequest
      }>,
      reply
    ) => {
      req.check(Permissions.Create)
      const entry = await fastify.db.WorkingHoursEntry.findOne({
        where: {
          userId: req.user.id,
          id: req.params.entryId,
        },
      })
      if (!entry) {
        return reply.throw.notFound()
      }

      // validate entry
      let error = validateEntry(req.body)
      if (error) {
        return reply.throw.badParams(error)
      }

      // validate all entries for a day
      const existingEntries = await fastify.db.WorkingHoursEntry.findAll({
        where: {
          date: entry.date,
          userId: req.user.id,
        },
      })
      const mergedEntries = existingEntries.map((x) =>
        x.id === entry.id
          ? { ...x, startTime: entry.startTime, endTime: entry.endTime }
          : x
      )

      error = validateDayEntries(mergedEntries)
      if (error) {
        return reply.throw.conflict(error)
      }

      await entry
        .set({
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        })
        .save()
      return reply.ok()
    }
  )

  fastify.get('/default-entries', async (req, reply) => {
    req.check(Permissions.Create)
    if (isOutOfTestGroup(req.user)) {
      return reply.throw.accessDenied()
    }
    const entries = await fastify.db.DefaultWorkingHoursEntry.findAll({
      where: {
        userId: req.user.id,
      },
    })
    return reply.send(entries)
  })

  fastify.post(
    '/default-entries',
    async (
      req: FastifyRequest<{ Body: DefaultWorkingHoursEntryCreationRequest }>,
      reply
    ) => {
      req.check(Permissions.Create)
      if (isOutOfTestGroup(req.user)) {
        return reply.throw.accessDenied()
      }
      const newEntry = {
        ...req.body,
        userId: req.user.id,
      } as DefaultWorkingHoursEntry
      let error: string | null = null

      // validate new entry
      error = validateEntry(newEntry)
      if (error) {
        return reply.throw.badParams(error)
      }

      // validate entries set
      const existingDefaultEntries =
        await fastify.db.DefaultWorkingHoursEntry.findAll({
          where: { userId: req.user.id },
        })
      const mergedDefaultEntries = [...existingDefaultEntries, newEntry]
      error = validateDayEntries(mergedDefaultEntries)
      if (error) {
        return reply.throw.conflict(error)
      }

      // save new entries
      await fastify.db.DefaultWorkingHoursEntry.create(newEntry)
      return reply.ok()
    }
  )

  fastify.delete(
    '/default-entries/:entryId',
    async (req: FastifyRequest<{ Params: { entryId: string } }>, reply) => {
      req.check(Permissions.Create)
      const entry = await fastify.db.DefaultWorkingHoursEntry.findOne({
        where: {
          userId: req.user.id,
          id: req.params.entryId,
        },
      })
      if (!entry) {
        return reply.throw.notFound()
      }
      await entry.destroy()
      return reply.ok()
    }
  )

  fastify.put(
    '/default-entries/:entryId',
    async (
      req: FastifyRequest<{
        Params: { entryId: string }
        Body: DefaultWorkingHoursEntryUpdateRequest
      }>,
      reply
    ) => {
      req.check(Permissions.Create)
      const entry = await fastify.db.DefaultWorkingHoursEntry.findOne({
        where: {
          userId: req.user.id,
          id: req.params.entryId,
        },
      })
      if (!entry) {
        return reply.throw.notFound()
      }

      // validate entry
      let error = validateEntry(req.body)
      if (error) {
        return reply.throw.badParams(error)
      }

      // validate all entries for a day
      const existingEntries = await fastify.db.DefaultWorkingHoursEntry.findAll(
        {
          where: {
            userId: req.user.id,
          },
        }
      )
      const mergedEntries = existingEntries.map((x) =>
        x.id === entry.id
          ? { ...x, startTime: entry.startTime, endTime: entry.endTime }
          : x
      )

      error = validateDayEntries(mergedEntries)
      if (error) {
        return reply.throw.conflict(error)
      }

      await entry
        .set({
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        })
        .save()
      return reply.ok()
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get('/config', async (req: FastifyRequest, reply) => {
    req.check(Permissions.AdminList)
    const metadata = appConfig.getModuleMetadata('working-hours') as Metadata
    return metadata.configByRole
  })

  fastify.get(
    '/entries',
    async (
      req: FastifyRequest<{
        Querystring: { startDate?: string; endDate?: string; userId?: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const { startDate, endDate, userId } = req.query

      const where: WhereOptions<WorkingHoursEntry> = {}
      if (startDate) {
        where.date = { [Op.gte]: startDate }
      }
      if (endDate) {
        where.date = {
          ...((where.date as object) || {}),
          [Op.lte]: endDate,
        }
      }
      if (userId) {
        where.userId = userId
      }
      const entries = await fastify.db.WorkingHoursEntry.findAll({
        where,
        order: [['date', 'DESC']],
      })
      return reply.send(entries)
    }
  )

  fastify.get(
    '/time-off-requests',
    async (
      req: FastifyRequest<{
        Querystring: { startDate?: string; endDate?: string; userId?: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const startDate = req.query.startDate
        ? dayjs(req.query.startDate, DATE_FORMAT)
        : null
      const endDate = req.query.endDate
        ? dayjs(req.query.endDate, DATE_FORMAT)
        : dayjs()

      const where: WhereOptions<TimeOffRequest> = {
        status: TimeOffRequestStatus.Approved,
      }
      if (startDate && endDate) {
        where.dates = { [Op.overlap]: getIntervalDates(startDate, endDate) }
      }
      if (req.query.userId) {
        where.userId = req.query.userId
      }
      const requests = await fastify.db.TimeOffRequest.findAll({
        where,
      })
      return reply.send(requests)
    }
  )

  fastify.get(
    '/public-holidays',
    async (
      req: FastifyRequest<{
        Querystring: {
          startDate?: string
          endDate?: string
          calendarId?: string
        }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const startDate = req.query.startDate
      const endDate = req.query.endDate

      const where: WhereOptions<PublicHoliday> = {}
      if (startDate && endDate) {
        where.date = {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        }
      }
      if (req.query.calendarId) {
        where.calendarId = req.query.calendarId
      }
      const holidays = await fastify.db.PublicHoliday.findAll({
        where,
      })
      return holidays
    }
  )

  fastify.get(
    '/user-configs',
    async (
      req: FastifyRequest<{
        Querystring: {
          role?: string
          userId?: string
        }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const metadata = appConfig.getModuleMetadata('working-hours') as Metadata
      const allowedRoles = Object.keys(metadata.configByRole)

      const where: WhereOptions<WorkingHoursUserConfig> = {}
      if (req.query.userId) {
        where['userId'] = req.query.userId
      } else if (req.query.role) {
        if (!allowedRoles.includes(req.query.role)) {
          return reply.throw.badParams(`Unknown role "${req.query.role}"`)
        }
        const userIds = await fastify.db.User.findAllActive({
          where: { roles: { [Op.contains]: [req.query.role] } },
          attributes: ['id'],
        }).then(map(prop('id')))
        where['userId'] = { [Op.in]: userIds }
      }

      const userConfigs = await fastify.db.WorkingHoursUserConfig.findAll({
        where,
      })
      return userConfigs
    }
  )

  fastify.get(
    '/export',
    async (
      req: FastifyRequest<{
        Querystring: {
          role: string
          from: string
          to: string
          roundUp?: string
        }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      if (!req.query.role || !req.query.from || !req.query.to) {
        return reply.throw.badParams('Missing parameters')
      }
      const metadata = appConfig.getModuleMetadata('working-hours') as Metadata
      if (
        !metadata ||
        !req.query.role ||
        !metadata.configByRole[req.query.role]
      ) {
        return reply.throw.misconfigured('Unsuported role')
      }
      const moduleConfig = metadata.configByRole[
        req.query.role
      ] as WorkingHoursConfig

      const roundUp = !!req.query.roundUp
      let from = dayjs(req.query.from, DATE_FORMAT)
      let to = dayjs(req.query.to, DATE_FORMAT)
      if (roundUp) {
        from = from.startOf('isoWeek')
        to = to.endOf('isoWeek')
      }
      const intervalDates = getIntervalDates(from, to)
      const intervalWeeks = getIntervalWeeks(from, to).sort(
        sortWith(prop('index'), 'desc')
      )

      const users = await fastify.db.User.findAll({
        where: { roles: { [Op.contains]: [req.query.role] } },
      })
      const userConfigs = await fastify.db.WorkingHoursUserConfig.findAll({
        where: { userId: { [Op.in]: users.map(prop('id')) } },
      })
      const userConfigByUserId = userConfigs.reduce(by('userId'), {})
      const entries = await fastify.db.WorkingHoursEntry.findAll({
        where: {
          userId: { [Op.in]: users.map(prop('id')) },
          date: {
            [Op.gte]: from.format(DATE_FORMAT),
            [Op.lte]: to.format(DATE_FORMAT),
          },
        },
        order: ['date'],
      })
      const timeOffRequests = await fastify.db.TimeOffRequest.findAll({
        where: {
          userId: { [Op.in]: users.map(prop('id')) },
          status: TimeOffRequestStatus.Approved,
          dates: { [Op.overlap]: intervalDates },
        },
      })
      const timeOffRequestsById = timeOffRequests.reduce(by('id'), {})
      const publicHolidays = moduleConfig.publicHolidayCalendarId
        ? await fastify.db.PublicHoliday.findAll({
            where: {
              calendarId: moduleConfig.publicHolidayCalendarId,
              date: {
                [Op.gte]: from.format(DATE_FORMAT),
                [Op.lte]: to.format(DATE_FORMAT),
              },
            },
          })
        : []

      type IndexedPublicHoliday = PublicHoliday & {
        weekIndex: string
      }
      const indexedPublicHolidays: IndexedPublicHoliday[] = publicHolidays.map(
        (x) => ({
          ...x.toJSON(),
          weekIndex: dayjs(x.date, DATE_FORMAT)
            .startOf('isoWeek')
            .format(DATE_FORMAT),
        })
      )
      const publicHolidaysByWeekIndex = indexedPublicHolidays.reduce(
        fp.groupBy('weekIndex'),
        {}
      )

      const usersById = users.reduce(by('id'), {})

      // group entries by user & by week
      type EnhancedWorkingHoursEntry = WorkingHoursEntry & {
        weekIndex: string
      }

      const enhancedEntries: EnhancedWorkingHoursEntry[] = entries.map((x) => ({
        ...x.toJSON(),
        weekIndex: dayjs(x.date, DATE_FORMAT)
          .startOf('isoWeek')
          .format(DATE_FORMAT),
      }))

      const entriesByWeekIndex = enhancedEntries.reduce(
        groupBy('weekIndex'),
        {}
      )

      const entriesByUserByWeekIndex: Record<
        string,
        Record<string, EnhancedWorkingHoursEntry[]>
      > = {}
      for (const weekIndex in entriesByWeekIndex) {
        entriesByUserByWeekIndex[weekIndex] = entriesByWeekIndex[
          weekIndex
        ].reduce(groupBy('userId'), {})
      }

      // group time off dates by user & by week
      type TimeOffRef = { weekIndex: string; userId: string; id: string }
      const timeOffRefs: TimeOffRef[] = timeOffRequests
        .map((x) =>
          x.dates.map((d) => ({
            weekIndex: dayjs(d, DATE_FORMAT)
              .startOf('isoWeek')
              .format(DATE_FORMAT),
            userId: x.userId,
            id: String(x.id),
          }))
        )
        .flat()
      const timeOffRefsByWeekIndex = timeOffRefs.reduce(
        groupBy('weekIndex'),
        {}
      )
      const timeOffRefsByUserByWeekIndex: Record<
        string,
        Record<string, TimeOffRef[]>
      > = {}
      for (const weekIndex in timeOffRefsByWeekIndex) {
        timeOffRefsByUserByWeekIndex[weekIndex] = timeOffRefsByWeekIndex[
          weekIndex
        ].reduce(groupBy('userId'), {})
      }

      // prepare CSV
      const exportDateFormat = 'D MMMM YYYY'
      const csvRows: string[][] = []
      csvRows.push([
        'User',
        'Email',
        'Week start',
        'Week end',
        'Working time',
        // 'Working hours',
        'Overwork',
        'Entries',
        'Entry creation date',
        'Time Off',
        'Time Off (entries)',
        'Agreed working week',
        'Public holidays',
        'Public holidays (entries)',
      ])

      // iterate over each week
      for (const week of intervalWeeks) {
        const daysOfWeek = getIntervalDates(week.start, week.end)
        const entriesByUser = entriesByUserByWeekIndex[week.index] || {}
        const timeOffRefsByUser = timeOffRefsByUserByWeekIndex[week.index] || {}
        const userIds = Array.from(
          new Set([
            ...Object.keys(entriesByUser),
            ...Object.keys(timeOffRefsByUser),
          ])
        )
        if (!userIds.length) continue
        const publicHolidays: PublicHoliday[] = (
          publicHolidaysByWeekIndex[week.index] || []
        ).map(fp.omit(['weekIndex']))
        const publicHolidayTime = calculateTotalPublicHolidaysTime(
          publicHolidays,
          moduleConfig
        )
        const publicHolidayTimeDurationString = publicHolidayTime
          ? getDurationString(publicHolidayTime)
          : ''
        const publicHolidayEntries = publicHolidays
          .map(
            (x) =>
              `${dayjs(x.date, DATE_FORMAT).format(exportDateFormat)}: ${
                x.name
              }`
          )
          .join('\n')

        for (const userId of userIds) {
          const user = usersById[userId]
          const entries = entriesByUser[userId] || []
          const timeOffRefs = timeOffRefsByUser[userId] || []
          const timeOffRequestIds = Array.from(
            new Set(timeOffRefs.map(prop('id')))
          )
          const timeOffRequests = timeOffRequestIds.map(
            (x) => timeOffRequestsById[x]
          )
          const userConfig = userConfigByUserId[userId]?.value || {}
          const mergedModuleConfig = { ...moduleConfig, ...userConfig }

          const entriesByDate = entries.reduce(groupBy('date'), {})
          const days = Object.keys(entriesByDate).sort()
          const dayEntries = days
            .map((date) => {
              const dateLabel = dayjs(date, DATE_FORMAT).format('D MMMM')
              const entries = entriesByDate[date]
                .map((x) => `${x.startTime}-${x.endTime}`)
                .join(', ')
              return `${dateLabel}: ${entries}`
            })
            .join('\n')
          const dayEntryCreationDates = days
            .map((date) => {
              return (entriesByDate[date] || [])
                .map((x) => dayjs(x.updatedAt).format('D MMMM HH:mm'))
                .join(', ')
            })
            .join('\n')
          const workingHours = calculateTotalWorkingHours(entries)
          // const workingHoursExact = getExactHours(workingHours)
          const timeOffTime = calculateTotalTimeOffTime(
            [week.start, week.end],
            timeOffRequests,
            mergedModuleConfig
          )
          const { time: overworkTime } = calculateOverwork(
            sumTime(workingHours, timeOffTime, publicHolidayTime),
            mergedModuleConfig
          )

          const timeOffByDate = getTimeOffByDate(timeOffRequests)
          const timeOffEntries = daysOfWeek
            .reduce<string[]>((acc, date) => {
              const entry = timeOffByDate[date]
              return !entry
                ? acc
                : [
                    ...acc,
                    `${dayjs(date, DATE_FORMAT).format(exportDateFormat)}: ${
                      entry.value
                    } ${entry.unit}(s)`,
                  ]
            }, [])
            .join('\n')

          csvRows.push([
            user.fullName || 'UNKNOWN',
            user.email || 'UNKNOWN',
            week.start.format(exportDateFormat) || '~UNKNOWN~',
            week.end.format(exportDateFormat) || '~UNKNOWN~',
            workingHours ? getDurationString(workingHours) : '0h',
            // String(workingHoursExact),
            overworkTime ? getDurationString(overworkTime) : '',
            dayEntries,
            dayEntryCreationDates,
            timeOffTime ? getDurationString(timeOffTime) : '',
            timeOffEntries || '',
            `${mergedModuleConfig.weeklyWorkingHours}h`,
            publicHolidayTimeDurationString,
            publicHolidayEntries,
          ])
        }
      }

      const csvContent = csvParser.unparse(csvRows)
      reply.headers({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=time-tracking-${req.query.role}-${req.query.from}-${req.query.to}.csv`,
        Pragma: 'no-cache',
      })
      return reply.code(200).send(csvContent)
    }
  )

  fastify.get(
    '/export/user/:userId',
    async (
      req: FastifyRequest<{
        Params: { userId: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const user = await fastify.db.User.findByPk(req.params.userId)
      if (!user) {
        return reply.throw.notFound()
      }

      const metadata = appConfig.getModuleMetadata('working-hours') as Metadata
      const allowedRoles = Object.keys(metadata.configByRole)
      const userRole = user.roles.find((x) => allowedRoles.includes(x))
      if (!userRole) {
        return reply.throw.misconfigured('Unsuported role')
      }
      const moduleConfig = metadata.configByRole[userRole] as WorkingHoursConfig

      const userConfig = await fastify.db.WorkingHoursUserConfig.findOne({
        where: { userId: user.id },
      })
      const mergedModuleConfig = {
        ...moduleConfig,
        ...(userConfig?.value || {}),
      }

      const entries = await fastify.db.WorkingHoursEntry.findAll({
        where: {
          userId: user.id,
        },
        order: ['date'],
      })
      const timeOffRequests = await fastify.db.TimeOffRequest.findAll({
        where: {
          userId: user.id,
          status: TimeOffRequestStatus.Approved,
        },
      })
      const dateRange = getDateRangeEdges([
        ...entries.map(fp.prop('date')),
        ...timeOffRequests.map((x) => x.dates).flat(),
      ])
      const publicHolidays = dateRange
        ? await fastify.db.PublicHoliday.findAll({
            where: {
              calendarId: moduleConfig.publicHolidayCalendarId,
              date: {
                [Op.gte]: dateRange[0],
                [Op.lte]: dateRange[1],
              },
            },
          })
        : []
      type IndexedPublicHoliday = PublicHoliday & {
        weekIndex: string
      }
      const indexedPublicHolidays: IndexedPublicHoliday[] = publicHolidays.map(
        (x) => ({
          ...x.toJSON(),
          weekIndex: dayjs(x.date, DATE_FORMAT)
            .startOf('isoWeek')
            .format(DATE_FORMAT),
        })
      )
      const publicHolidaysByWeekIndex = indexedPublicHolidays.reduce(
        fp.groupBy('weekIndex'),
        {}
      )

      const timeOffRequestsById = timeOffRequests.reduce(by('id'), {})

      // group entries by week index
      const indexedEntries = entries.map((x) => ({
        ...x.toJSON(),
        weekIndex: dayjs(x.date, DATE_FORMAT)
          .startOf('isoWeek')
          .format(DATE_FORMAT),
      }))
      const groupedByWeekIndex = indexedEntries.reduce(groupBy('weekIndex'), {})
      const weekIndexes = getWeekIndexesRange(dateRange || [])

      // group time off days by week index
      type TimeOffRef = { weekIndex: string; id: string }
      const timeOffRefs: TimeOffRef[] = timeOffRequests
        .map((x) =>
          x.dates.map((d) => ({
            weekIndex: dayjs(d, DATE_FORMAT)
              .startOf('isoWeek')
              .format(DATE_FORMAT),
            id: String(x.id),
          }))
        )
        .flat()
      const timeOffRefsByWeekIndex = timeOffRefs.reduce(
        groupBy('weekIndex'),
        {}
      )

      // prepare CSV
      const exportDateFormat = 'D MMMM YYYY'
      const csvRows: string[][] = []
      csvRows.push([
        'Week start',
        'Week end',
        'Working time',
        // 'Working hours',
        'Overwork',
        'Entries',
        'Entry creation date',
        'Time Off',
        'Time Off (entries)',
        'Public holidays',
        'Public holidays (entries)',
      ])

      // iterate over each week
      weekIndexes.forEach((weekIndex) => {
        const startOfWeek = dayjs(weekIndex, DATE_FORMAT)
        const endOfWeek = startOfWeek.endOf('isoWeek')
        const daysOfWeek = getIntervalDates(startOfWeek, endOfWeek)
        const entriesGroupedByDay = (groupedByWeekIndex[weekIndex] || [])
          .map(omit(['weekIndex']))
          .reduce(groupBy('date'), {})
        const days = Object.keys(entriesGroupedByDay).sort(
          sortWith((x) => dayjs(x, DATE_FORMAT).unix(), 'asc')
        )
        const dayEntries = days
          .map((date) => {
            const dateLabel = dayjs(date, DATE_FORMAT).format('D MMMM')
            const entries = (entriesGroupedByDay[date] || [])
              .map((x) => `${x.startTime}-${x.endTime}`)
              .join(', ')
            return `${dateLabel}: ${entries}`
          })
          .join('\n')
        const dayEntryCreationDates = days
          .map((date) => {
            return (entriesGroupedByDay[date] || [])
              .map((x) => dayjs(x.updatedAt).format('D MMMM HH:mm'))
              .join(', ')
          })
          .join('\n')
        const timeOffRefs = timeOffRefsByWeekIndex[weekIndex] || []
        const timeOffRequestIds = Array.from(
          new Set(timeOffRefs.map(prop('id')))
        )
        const timeOffRequests = timeOffRequestIds.map(
          (x) => timeOffRequestsById[x]
        )
        const timeOffTime = calculateTotalTimeOffTime(
          [startOfWeek, endOfWeek],
          timeOffRequests,
          mergedModuleConfig
        )

        const publicHolidays: PublicHoliday[] = (
          publicHolidaysByWeekIndex[weekIndex] || []
        ).map(fp.omit(['weekIndex']))
        const publicHolidaysTime = calculateTotalPublicHolidaysTime(
          publicHolidays,
          mergedModuleConfig
        )
        const publicHolidaysTimeDurationString = publicHolidaysTime
          ? getDurationString(publicHolidaysTime)
          : ''
        const publicHolidaysEntries = publicHolidays
          .map(
            (x) =>
              `${dayjs(x.date, DATE_FORMAT).format(exportDateFormat)}: ${
                x.name
              }`
          )
          .join('\n')

        const totalWorkingHours = calculateTotalWorkingHours(
          groupedByWeekIndex[weekIndex] || []
        )
        const { time: overworkTime } = calculateOverwork(
          sumTime(totalWorkingHours, timeOffTime, publicHolidaysTime),
          mergedModuleConfig
        )

        const timeOffByDate = getTimeOffByDate(timeOffRequests)
        const timeOffEntries = daysOfWeek
          .reduce<string[]>((acc, date) => {
            const entry = timeOffByDate[date]
            return !entry
              ? acc
              : [
                  ...acc,
                  `${dayjs(date, DATE_FORMAT).format(exportDateFormat)}: ${
                    entry.value
                  } ${entry.unit}(s)`,
                ]
          }, [])
          .join('\n')

        csvRows.push([
          startOfWeek.format('D MMMM YYYY'),
          endOfWeek.format('D MMMM YYYY'),
          totalWorkingHours ? getDurationString(totalWorkingHours) : '0h',
          // String(totalWorkingHours ? getExactHours(totalWorkingHours) : 0),
          overworkTime ? getDurationString(overworkTime) : '',
          dayEntries,
          dayEntryCreationDates,
          timeOffTime ? getDurationString(timeOffTime) : '',
          timeOffEntries || '',
          publicHolidaysTimeDurationString,
          publicHolidaysEntries,
        ])
      })

      const csvContent = csvParser.unparse(csvRows)
      reply.headers({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=time-tracking-${user.email}.csv`,
        Pragma: 'no-cache',
      })
      return reply.code(200).send(csvContent)
    }
  )
}

module.exports = {
  userRouter,
  adminRouter,
}

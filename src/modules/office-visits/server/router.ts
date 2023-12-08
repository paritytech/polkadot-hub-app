import csvParser from 'papaparse'
import dayjs, { Dayjs } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Op } from 'sequelize'
import { appConfig } from '#server/app-config'
import { DATE_FORMAT } from '#server/constants'
import {
  BUSINESS_DAYS_LIMIT,
  getBusinessDaysFromDate,
  getDate,
} from './helpers'
import { Permissions } from '../permissions'
import { Visit, GenericVisit, VisitType, VisitsDailyStats } from '#shared/types'
import * as fp from '#shared/utils'

dayjs.extend(localizedFormat)

// @todo fix types
const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/',
    async (
      req: FastifyRequest<{
        Querystring: { date: string; limit: number; officeId: string }
      }>,
      reply
    ) => {
      const { date, officeId } = req.query
      if (!officeId) {
        return reply.throw.badParams('Missing office ID')
      }
      const office = appConfig.getOfficeById(officeId)

      const nextBusinessDays = getBusinessDaysFromDate(
        date,
        BUSINESS_DAYS_LIMIT
      )
      // @todo REwrite this using native SQL query using JOIN on dates
      // or rewrite by mergin all the tables into one
      let result: Record<string, any> = {}

      const addToResult = (value: GenericVisit, date: string, type: string) => {
        if (!result[getDate(date, office.timezone)]) {
          result[getDate(date, office.timezone)] = {}
        }
        if (!result[getDate(date, office.timezone)][type]) {
          result[getDate(date, office.timezone)][type] = [value]
        } else {
          result[getDate(date, office.timezone)][type].push(value)
        }
      }

      const visits = await fastify.db.Visit.findAll({
        where: {
          officeId: officeId,
          status: 'confirmed',
          userId: req.user.id,
          date: {
            // @todo change in the database for dates just to be in the DATE_FORMAT. We do not need to record date and time for vists.
            [Op.gte]: dayjs(date).toDate(),
          },
        },
        order: ['date'],
      })

      const roomReservations = await fastify.db.RoomReservation.findAll({
        where: {
          office: officeId,
          creatorUserId: req.user.id,
          status: 'confirmed',
          startDate: {
            [Op.between]: [
              dayjs(nextBusinessDays[0]).startOf('day').toDate(),
              dayjs(nextBusinessDays[nextBusinessDays.length - 1])
                .endOf('day')
                .toDate(),
            ],
          },
        },
        order: ['startDate'],
      })

      const dates = []
      let i = 0
      while (i < BUSINESS_DAYS_LIMIT) {
        dates.push({
          [Op.contains]: [nextBusinessDays[i]],
        })
        i++
      }

      let guests = await fastify.db.GuestInvite.findAll({
        attributes: ['fullName', 'id', 'dates'],
        where: {
          creatorUserId: req.user.id,
          office: officeId,
          status: 'confirmed',
          dates: {
            [Op.or]: dates,
          },
        },
      })

      const getTime = (date: string | Date) =>
        dayjs(date).tz(office.timezone).format('LT')

      // adding all the dates together
      visits.forEach((v) =>
        addToResult(
          {
            id: v.id,
            value: `Desk ${v.deskName}`,
            description: v.areaName,
            type: VisitType.Visit,
          },
          v.date,
          VisitType.Visit
        )
      )
      guests.forEach((guest) => {
        guest.dates.forEach((date) =>
          addToResult(
            {
              value: guest.fullName,
              id: guest.id,
              type: VisitType.Guest,
            },
            date,
            VisitType.Guest
          )
        )
      })
      roomReservations.forEach((reservation) => {
        const office = appConfig.offices.find((o) => o.id === officeId)
        const officeRoom = (office?.rooms || []).find(
          (r) => r.id === reservation.roomId
        )
        return addToResult(
          {
            id: reservation.id,
            dateTime: `${getTime(reservation.startDate)} - ${getTime(
              reservation.endDate
            )}`,
            value: officeRoom?.name ?? '',
            description: officeRoom?.description,
            type: VisitType.RoomReservation,
          },
          dayjs(reservation.startDate).toString(),
          VisitType.RoomReservation
        )
      })

      // filtering only the latest results according to limit
      const filteredResult: Record<string, any> = {}
      // all the dates with data in the period defined by businessDaysLimit
      const allDates = Object.keys(result).sort((a: string, b: string) =>
        dayjs(a).isAfter(dayjs(b)) ? 1 : -1
      )
      let index = 0
      while (index < allDates.length) {
        filteredResult[allDates[index]] = result[allDates[index]]
        index++
      }
      return filteredResult
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/stats',
    async (
      req: FastifyRequest<{
        Querystring: { from: string; to: string; format?: 'csv' }
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Missing office ID')
      }
      req.check(Permissions.AdminList, req.office.id)
      const { from, to, format } = req.query
      if (!from || !to) {
        return reply.throw.badParams('Missing "from" or "to" parameter')
      }
      if (format && format !== 'csv') {
        return reply.throw.badParams('Invalid "format" parameter')
      }
      const dateRange: [Dayjs, Dayjs] = [
        dayjs(from, DATE_FORMAT).startOf('date'),
        dayjs(to, DATE_FORMAT).endOf('date'),
      ]
      const visits = await fastify.db.Visit.findAll({
        where: {
          status: 'confirmed',
          officeId: req.office.id,
          date: {
            [Op.between]: [dateRange[0].toDate(), dateRange[1].toDate()],
          },
        },
      })

      const userIds = visits
        .map((x) => x.userId)
        .reduce(
          (acc, x) => (acc.includes(x) ? acc : acc.concat(x)),
          [] as string[]
        )
      const guestInviteIds = visits
        .map((x) => x.metadata?.guestInviteId)
        .filter(Boolean)
      const guestInvites = guestInviteIds.length
        ? await fastify.db.GuestInvite.findAll({
            where: { id: { [Op.in]: guestInviteIds } },
          })
        : []
      const guestInviteById = guestInvites.reduce(fp.by('id'), {})

      // search for all users for statistics
      const users = await fastify.db.User.findAll({
        where: { id: { [Op.in]: userIds } },
      })
      const userById = users.reduce(
        (acc, x) => ({ ...acc, [x.id]: x }),
        {} as Record<string, (typeof users)[0]>
      )

      const visitsByDate: Record<string, Visit[]> = visits.reduce(
        (acc, x) => ({
          ...acc,
          [x.date]: acc[x.date] ? [...acc[x.date], x] : [x],
        }),
        {} as Record<string, Visit[]>
      )
      const daysNumber = dateRange[1].diff(dateRange[0], 'day') + 1
      const visitsConfig = req.office.visitsConfig
      const result: VisitsDailyStats[] = []
      if (visitsConfig) {
        for (let i = 0; i < daysNumber; i++) {
          const date = dateRange[0].add(i, 'day').format(DATE_FORMAT)
          const visits = visitsByDate[date] || []
          const existingVisitsNumber = visits.length
          const departments = visits.map((x) => {
            if (!!x.metadata.guestInviteId) {
              return 'Guests'
            }
            return userById[x.userId]?.department || 'Unknown'
          })
          const departmentDistribution = departments.reduce((acc, x) => {
            return acc[x] ? { ...acc, [x]: acc[x] + 1 } : { ...acc, [x]: 1 }
          }, {} as Record<string, number>)
          const departmentRatios: Array<{
            department: string
            occupancyPercent: number
          }> = []
          for (const [key, value] of Object.entries(departmentDistribution)) {
            departmentRatios.push({
              department: key,
              occupancyPercent: value / departments.length,
            })
          }
          const guests = visits
            .map((x) => x.metadata.guestInviteId)
            .filter(Boolean)
            .map((x) => {
              const invite = guestInviteById[x]
              if (!invite) {
                fastify.log.warn(
                  `Office-visits stats: Missing invite entity id=${x}`
                )
                return { fullName: 'UNKNOWN GUEST', email: '' }
              }
              return {
                fullName: invite.fullName,
                email: invite.email,
              }
            })
          result.push({
            date,
            maxCapacity: visitsConfig.maxCapacity,
            existingVisitsNumber,
            occupancyPercent: existingVisitsNumber / visitsConfig.maxCapacity,
            occupancyPercentByDepartment: departmentRatios,
            guests,
          })
        }
      }

      // return as JSON
      if (!format) {
        return result
      }

      // return as CSV
      const csvRows: string[][] = []

      // csv header
      const header = ['Date', 'Confirmed Visits', 'Occupancy']
      csvRows.push(header)

      // csv body
      result.forEach((x) => {
        const row: string[] = []
        row.push(dayjs(x.date, DATE_FORMAT).format('D MMMM, YYYY'))
        row.push(String(x.existingVisitsNumber))
        row.push(`${Number((x.occupancyPercent * 100).toFixed(1))}%`)
        csvRows.push(row)
      })

      const csvContent = csvParser.unparse(csvRows)

      reply.headers({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=visits-${dateRange[0].format(
          'DDMMYY'
        )}-${dateRange[1].format('DDMMYY')}.csv`,
        Pragma: 'no-cache',
      })
      return reply.code(200).send(csvContent)
    }
  )
}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}

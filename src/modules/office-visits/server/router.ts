import csvParser from 'papaparse'
import dayjs, { Dayjs } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Op } from 'sequelize'
import { DATE_FORMAT } from '#server/constants'
import {
  BUSINESS_DAYS_LIMIT,
  formatRoomReservationsResult,
  formatVisit,
  getBusinessDaysFromDate,
  getDate,
} from './helpers'
import { Permissions } from '../permissions'
import { Metadata } from '../metadata-schema'
import { Visit, GenericVisit, VisitType, VisitsDailyStats } from '#shared/types'
import * as fp from '#shared/utils'
import { appConfig } from '#server/app-config'

dayjs.extend(localizedFormat)

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const addToUpcomingByDate = (
  upcomingByDate: Record<string, any>,
  value: GenericVisit,
  date: string,
  type: string
) => {
  const dateKey = getDate(date)
  upcomingByDate[dateKey] = upcomingByDate[dateKey] || {}
  upcomingByDate[dateKey][type] = upcomingByDate[dateKey][type] || []
  upcomingByDate[dateKey][type].push(value)
}

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
      const nextBusinessDays = getBusinessDaysFromDate(
        date,
        BUSINESS_DAYS_LIMIT
      )
      // @todo REwrite this using native SQL query using JOIN on dates
      // or rewrite by merging all the tables into one
      let result: Record<string, any> = {}

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

      // adding all the dates together
      visits.forEach((v) =>
        addToUpcomingByDate(result, formatVisit(v), v.date, VisitType.Visit)
      )
      guests.forEach((guest) => {
        guest.dates.forEach((date) =>
          addToUpcomingByDate(
            result,
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
      const office = appConfig.getOfficeById(officeId)
      roomReservations.forEach((reservation) => {
        const area = office?.areas?.find((area) =>
          area.meetingRooms?.find((room) => room.id === reservation.roomId)
        )

        return addToUpcomingByDate(
          result,
          formatRoomReservationsResult(reservation, officeId, area?.id ?? ''),
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
      const metadata = appConfig.getModuleMetadata('office-visits') as Metadata
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
          const roleGroup = appConfig.config.permissions.roleGroups.find(
            fp.propEq('id', metadata.statistics.splitByRoleGroup)
          )!
          const roleById = roleGroup.roles.reduce(fp.by('id'), {})
          const roleIds = roleGroup.roles.map(fp.prop('id'))
          const visitorsRoles = visits.map((x) => {
            if (!!x.metadata.guestInviteId) {
              return 'Guests'
            }
            const user = userById[x.userId]
            const role = user.roles.find(fp.isIn(roleIds))
            return role ? roleById[role].name : 'Unknown'
          })
          const roleDistribution = visitorsRoles.reduce((acc, x) => {
            return acc[x] ? { ...acc, [x]: acc[x] + 1 } : { ...acc, [x]: 1 }
          }, {} as Record<string, number>)
          const roleRatios: Array<{
            role: string
            occupancyPercent: number
          }> = []
          for (const [key, value] of Object.entries(roleDistribution)) {
            roleRatios.push({
              role: key,
              occupancyPercent: value / visitorsRoles.length,
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
            occupancyPercentByRole: roleRatios,
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

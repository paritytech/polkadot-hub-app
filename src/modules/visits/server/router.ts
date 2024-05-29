import dayjs from 'dayjs'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Filterable, Op, fn, col, literal, QueryTypes } from 'sequelize'
import { appConfig } from '#server/app-config'
import {
  DATE_FORMAT,
  DATE_FORMAT_DAY_NAME,
  FRIENDLY_DATE_FORMAT,
  ROBOT_USER_ID,
} from '#server/constants'
import config from '#server/config'
import { OfficeArea, Office } from '#server/app-config/types'
import { appEvents } from '#server/utils/app-events'
import * as fp from '#shared/utils/fp'
import {
  getConflictedVisits,
  getFullBookableAreas,
  getReservedAreaIds,
  mapJoin,
  sortByDate,
} from './helpers'
import { Permissions } from '../permissions'
import {
  OfficeVisitor,
  PickedVisit,
  Visit,
  VisitsCreationRequest,
  VisitsOccupancy,
  VisitStatus,
  VisitsAdminDashboardStats,
} from '../types'

const mId = 'visits'

const publicRouter: FastifyPluginCallback = async (fastify, opts) => {
  fastify.get(
    '/config',
    async (req: FastifyRequest<{ Reply: Office['visitsConfig'] }>, reply) => {
      if (!req.office) {
        return reply.throw.badParams('Missing officeId')
      }
      if (!req.office.allowDeskReservation) {
        return reply.throw.misconfigured(
          `The ${req.office.name} office doesn't support desk reservation`
        )
      }
      return req.office.visitsConfig
    }
  )
}

const userRouter: FastifyPluginCallback = async (fastify, opts) => {
  fastify.get('/notice', async (req: FastifyRequest, reply) => {
    if (!req.office) {
      return reply.throw.badParams('Missing office ID')
    }
    req.check(Permissions.Create, req.office.id)
    return appConfig.templates.text(mId, 'visitNotice', {
      officeId: req.office,
    })
  })

  fastify.get(
    '/visits',
    async (
      req: FastifyRequest<{
        Querystring: { 'dates[]'?: string[] }
        Reply: Visit[]
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Missing office ID')
      }
      req.check(Permissions.Create, req.office.id)
      if (!req.office.allowDeskReservation) {
        return reply.throw.misconfigured(
          `The ${req.office.name} office doesn't support desk reservation`
        )
      }
      const dates = req.query['dates[]']
      const where: Record<string, any> = {
        userId: req.user.id,
        officeId: req.office.id,
        status: 'confirmed',
        date: {
          [Op.gte]: new Date(),
        },
      }
      if (dates?.length) {
        where.date[Op.in] = dates
      }
      const visits = await fastify.db.Visit.findAll({ where, order: ['date'] })
      return reply.send(visits)
    }
  )

  fastify.get(
    '/visits/:visitId',
    async (
      req: FastifyRequest<{
        Params: { visitId: string }
        Reply: Visit
      }>,
      reply
    ) => {
      if (!req.params.visitId) {
        return reply.throw.badParams()
      }
      const visit = await fastify.db.Visit.findByPk(req.params.visitId)
      if (!visit) {
        return reply.throw.notFound()
      }
      req.check(Permissions.Create, visit.officeId)
      if (
        req.user.id !== visit.id &&
        !req.can(Permissions.AdminManage, visit.officeId)
      ) {
        return reply.throw.accessDenied()
      }
      return reply.send(visit)
    }
  )

  fastify.put(
    '/visits/:visitId',
    async (
      req: FastifyRequest<{
        Params: { visitId: string }
        Body: { status: VisitStatus }
      }>,
      reply
    ) => {
      const visitId = req.params.visitId
      const status = req.body.status
      const visit = await fastify.db.Visit.findByPk(visitId)
      if (!visit) {
        return reply.throw.notFound()
      }
      req.check(Permissions.Create, visit.officeId)
      if (
        req.user.id !== visit.userId &&
        !req.can(Permissions.AdminManage, visit.officeId)
      ) {
        return reply.throw.accessDenied()
      }

      if (visit.status !== 'confirmed' && status !== 'cancelled') {
        return reply.throw.rejected()
      }
      await fastify.db.Visit.update({ status }, { where: { id: visitId } })

      // Send user notification to the user via Matrix
      if (fastify.integrations.Matrix) {
        const messageData = {
          status,
          date: dayjs(visit.date).format(DATE_FORMAT_DAY_NAME),
          office: appConfig.getOfficeById(visit.officeId),
        }
        const message = appConfig.templates.notification(
          mId,
          'visitStatusChange',
          {
            user: 'You',
            ...messageData,
          }
        )
        if (message) {
          fastify.integrations.Matrix.sendMessageToUserDeferred(
            req.user,
            message
          )
        }

        const adminMessage = appConfig.templates.notification(
          mId,
          'visitStatusChange',
          {
            user: `${req.user.fullName} (${req.user.email})`,
            ...messageData,
          }
        )
        if (adminMessage) {
          fastify.integrations.Matrix.sendMessageInAdminRoomDeferred(
            adminMessage
          )
        }
      }

      // appEvents.useModule('admin').emit('update_counters')
      return reply.ok()
    }
  )

  fastify.get(
    '/occupancy',
    async (req: FastifyRequest<{ Reply: VisitsOccupancy }>, reply) => {
      if (!req.office) {
        return reply.throw.badParams('Missing office ID')
      }
      req.check(Permissions.Create, req.office.id)
      if (!req.office.allowDeskReservation) {
        return reply.throw.misconfigured(
          `The ${req.office.name} office doesn't support desk reservation`
        )
      }
      const visitsConfig = req.office.visitsConfig!
      const visits = await fastify.db.Visit.findAll({
        where: {
          officeId: req.office.id,
          date: {
            [Op.between]: [
              dayjs().startOf('day').toDate(),
              dayjs()
                .startOf('day')
                .add(visitsConfig.bookableDays, 'days')
                .toDate(),
            ],
          },
        },
      })
      const visitsByDate: Record<string, Visit[]> = visits.reduce(
        (acc, x) => ({
          ...acc,
          [x.date]: acc[x.date] ? [...acc[x.date], x] : [x],
        }),
        {} as Record<string, Visit[]>
      )

      const today = dayjs().startOf('day')
      const workingDays = visitsConfig.workingDays.map((x: number) => x + 1)

      const result: VisitsOccupancy = []

      Array.from(Array(visitsConfig.bookableDays).keys()).forEach((i) => {
        const day = today.add(i, 'day')
        if (workingDays.includes(day.day())) {
          const date = day.format(DATE_FORMAT)
          const existingVisitsNumber = visitsByDate[date]?.length || 0
          result.push({
            date,
            maxCapacity: visitsConfig.maxCapacity,
            existingVisitsNumber: visitsByDate[date]?.length || 0,
            occupancyPercent: existingVisitsNumber / visitsConfig.maxCapacity,
          })
        }
      })
      return reply.send(result)
    }
  )

  fastify.get(
    '/areas',
    async (req: FastifyRequest<{ Reply: OfficeArea[] }>, reply) => {
      if (!req.office) {
        return reply.throw.badParams('Missing office ID')
      }
      req.check(Permissions.Create, req.office.id)
      if (!req.office.allowDeskReservation) {
        return reply.throw.misconfigured(
          `The ${req.office.name} office doesn't support desk reservation`
        )
      }
      return reply.send(req.office.areas?.filter((x) => x.available) || [])
    }
  )

  fastify.post(
    '/visit',
    async (req: FastifyRequest<{ Body: VisitsCreationRequest }>, reply) => {
      if (!req.body.officeId) {
        return reply.throw.badParams()
      }
      req.check(Permissions.Create, req.body.officeId)
      let visits: Array<PickedVisit> = []
      for (const visitsGroup of req.body.visits) {
        for (const date of visitsGroup.dates) {
          visits.push({
            userId: req.user.id,
            date: dayjs(date, DATE_FORMAT).toISOString(),
            officeId: req.body.officeId,
            areaId: visitsGroup.areaId,
            deskId: visitsGroup.deskId,
            metadata: req.body.metadata,
            status: req.body.status, // TODO: validate status
          })
        }
      }
      const office = appConfig.getOfficeById(req.body.officeId)
      if (!office) {
        return reply.throw.badParams('Invalid office ID')
      }
      if (!office.allowDeskReservation) {
        return reply.throw.misconfigured(
          `The ${office.name} office doesn't support desk reservation`
        )
      }
      const availableAreaIds = office
        .areas!.filter((x) => x.available)
        .map((x) => x.id)
      if (visits.some((x) => !availableAreaIds.includes(x.areaId))) {
        return reply.throw.badParams('Request contains unavailable areas')
      }

      try {
        await fastify.sequelize.transaction(async (t) => {
          const existingVisits = await fastify.db.Visit.findAll({
            where: {
              officeId: req.body.officeId,
              date: { [Op.in]: visits.map((x) => x.date) },
              status: { [Op.in]: ['pending', 'confirmed'] },
            },
            transaction: t,
          })

          // check whether the request contains already occupied desks
          const conflictedVisits = getConflictedVisits(
            existingVisits,
            visits,
            office
          )

          if (conflictedVisits.length) {
            const conflictedVisitLabels = conflictedVisits.map(
              (v) =>
                `${v.areaName}, ${v.deskName} on ${dayjs(v.date).format(
                  FRIENDLY_DATE_FORMAT
                )}`
            )
            return reply.throw.conflict(
              appConfig.templates.error(mId, 'unavailableDesks', {
                conflictedVisitLabels: mapJoin(conflictedVisitLabels),
              }) ?? ''
            )
          }

          // "fullAreaBooking" areaId + deskId pairs
          const bookableAreaDeskPairs = getFullBookableAreas(office.areas!)

          // check whether the requested desks are in fully booked areas
          const reservedAreaIds = getReservedAreaIds(
            existingVisits,
            bookableAreaDeskPairs
          )

          if (reservedAreaIds.length) {
            if (
              visits.filter((v) => reservedAreaIds.includes(v.areaId)).length
            ) {
              const reservedAreaNames = office
                .areas!.filter((a) => reservedAreaIds.includes(a.id))
                .map((x) => x.name)
              return reply.throw.conflict(
                appConfig.templates.error(mId, 'unavailableArea', {
                  reservedAreaNames: mapJoin(reservedAreaNames),
                }) ?? ''
              )
            }
          }

          // check whether the request contains "full_area" visits
          const requestedReservedDateAreaIds = visits
            .filter((v) =>
              bookableAreaDeskPairs.some(
                (x) => x?.areaId === v.areaId && x.deskId === v.deskId
              )
            )
            .map((v) => ({
              areaId: v.areaId,
              date: dayjs(v.date).format(DATE_FORMAT),
            }))
          if (requestedReservedDateAreaIds.length) {
            const conflictedVisits = existingVisits.filter((v) =>
              requestedReservedDateAreaIds.some(
                (x) => x.date === v.date && x.areaId === v.areaId
              )
            )
            if (conflictedVisits.length) {
              const conflictedAreaIds = conflictedVisits.map((x) => x.areaId)
              const areaNames = office
                .areas!.filter((a) => conflictedAreaIds.includes(a.id))
                .map((x) => x.name)
              return reply.throw.conflict(
                appConfig.templates.error(mId, 'failedBookingArea', {
                  reservedAreaNames: mapJoin(areaNames),
                }) ?? ''
              )
            }
          }

          const savedVisits = await fastify.db.Visit.bulkCreate(visits)

          // Send user notification to the user via Matrix
          if (fastify.integrations.Matrix && savedVisits.length) {
            const location = appConfig.getOfficeById(visits[0].officeId)
            const messageData = {
              visits: sortByDate(savedVisits, 'date')?.map((v: Visit) => {
                const area = location.areas!.find((x) => x.id === v.areaId)
                const desk = area?.desks.find((x) => x.id === v.deskId)

                return {
                  date: `${dayjs(v.date)
                    .tz(location.timezone)
                    .format(DATE_FORMAT_DAY_NAME)} (${v.status}) Area: ${
                    v.areaName
                  }. Desk: ${desk?.name}`,
                  cancel: `${config.appHost}/visits/${v.id}`,
                }
              }),
              location,
              user: req.user.usePublicProfileView(),
              office,
            }
            const getMessage = (templateName: string) =>
              appConfig.templates.notification(mId, templateName, messageData)
            const message = getMessage('officeVisitBooking')
            if (message) {
              fastify.integrations.Matrix.sendMessageToUserDeferred(
                req.user,
                message
              )
            }

            const adminMessage = getMessage('officeVisitBookingAdmin')
            if (adminMessage) {
              fastify.integrations.Matrix.sendMessageInAdminRoomDeferred(
                adminMessage
              )
            }
          }
        })
      } catch (err) {
        return reply.throw.internalError(
          `Failed to book desks. Please try again.`
        )
      }

      if (!reply.sent) {
        appEvents.useModule('admin').emit('update_counters')
        return reply.ok()
      }
    }
  )

  fastify.get(
    '/free-desks',
    async (
      req: FastifyRequest<{
        Querystring: { 'dates[]': string[] }
        Reply: Array<{ areaId: string; deskId: string }>
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Missing office ID')
      }
      // req.check(Permissions.Create, req.office.id)
      if (!req.office.allowDeskReservation) {
        return reply.throw.misconfigured(
          `The ${req.office.name} office doesn't support desk reservation`
        )
      }
      let dateStrings = req.query['dates[]']
      if (!Array.isArray(dateStrings)) {
        dateStrings = [dateStrings]
      }

      if (!dateStrings.filter(Boolean).length) {
        return []
      }

      const dates = dateStrings.map((x) => dayjs(x, DATE_FORMAT).toDate())

      const existingVisits = await fastify.db.Visit.findAll({
        where: {
          date: { [Op.in]: dates },
          officeId: req.office.id,
          status: { [Op.in]: ['pending', 'confirmed'] },
        },
      })

      const fullBookableAreas = getFullBookableAreas(req.office.areas!)
      const reservedAreaIds: string[] = getReservedAreaIds(
        existingVisits,
        fullBookableAreas
      )

      const allDesks = req.office
        .areas!.filter((a) => a.available)
        .map((a) =>
          a.desks.map((d) => ({
            areaId: a.id,
            deskId: d.id,
            type: d.type,
            user: d.user,
            multiple: d.allowMultipleBookings,
            permittedRoles: d.permittedRoles,
          }))
        )
        .flat()

      const deskRoles = Array.from(
        new Set(
          allDesks
            .filter((x) => x.permittedRoles.length)
            .map((x) => x.permittedRoles)
            .flat()
        )
      )
      const usersWithDeskRoles = await fastify.db.User.findAll({
        where: { roles: { [Op.overlap]: deskRoles } },
      })
      const deskRolesPresented = deskRoles.filter((x) =>
        usersWithDeskRoles.some((u) => u.roles.includes(x))
      )

      const desks = allDesks
        .filter((x) => {
          // desk is in the fully reserved area
          if (reservedAreaIds.includes(x.areaId)) {
            return false
          }
          // desk is only available for specified list of roles
          if (x.permittedRoles.length) {
            if (x.permittedRoles.some((x) => deskRolesPresented.includes(x))) {
              if (!x.permittedRoles.some((x) => req.user.roles.includes(x))) {
                return false
              }
            }
          }
          // Desk can be booked multiple times
          if (x.multiple) {
            return true
          }
          // Personal desk is not available for booking for anyone apart from the person it belongs to
          if (x.type === 'personal' && x.user !== req.user.email) {
            return false
          }
          // if any of the incoming bookings are for the full bookable areas
          if (
            fullBookableAreas.some(
              (p) => p?.areaId === x.areaId && p.deskId === x.deskId
            )
          ) {
            // if the full area has been already booked
            if (existingVisits.some((v) => v.areaId === x.areaId)) {
              return false
            }
          }
          return !existingVisits.some(
            (v) => x.areaId === v.areaId && x.deskId === v.deskId
          )
        })
        .map((x) => ({ areaId: x.areaId, deskId: x.deskId }))

      return desks
    }
  )

  fastify.get(
    '/visitors',
    async (
      req: FastifyRequest<{
        Querystring: { date: string }
        Reply: OfficeVisitor[]
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Missing office ID')
      }
      req.check(Permissions.ListVisitors, req.office.id)
      if (!req.office.allowDeskReservation) {
        return reply.throw.misconfigured(
          `The ${req.office.name} office doesn't support desk reservation`
        )
      }
      const visits = await fastify.db.Visit.findAll({
        where: {
          officeId: req.office.id,
          date: req.query.date || dayjs().format(DATE_FORMAT),
          status: 'confirmed',
        },
      })
      const users = await fastify.db.User.findAllActive({
        where: {
          id: { [Op.in]: visits.map((x) => x.userId) },
          stealthMode: false,
        },
      })

      return users.map((u) => {
        const visit = visits.find((x) => x.userId === u.id)
        const isRobot = u.id === ROBOT_USER_ID
        const result: OfficeVisitor = {
          userId: u.id,
          avatar: !isRobot ? u.avatar || '' : '',
          fullName: visit?.metadata.guestFullName || u?.fullName,
          areaName: visit?.areaName || 'UNKNOWN',
          deskId: visit?.deskId,
          areaId: visit?.areaId,
        }
        return result
      })
    }
  )

  fastify.post(
    '/stealth',
    async (req: FastifyRequest<{ Body: { stealthMode: boolean } }>, reply) => {
      await fastify.db.User.update(
        { stealthMode: req.body.stealthMode },
        { where: { id: req.user.id } }
      )
      return reply.ok()
    }
  )
}

const adminRouter: FastifyPluginCallback = async (fastify, opts) => {
  fastify.get(
    '/visits',
    async (
      req: FastifyRequest<{
        Querystring: { 'dates[]'?: string[] }
        Reply: Visit[]
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Missing office ID')
      }
      req.check(Permissions.AdminList, req.office.id)
      const dates = req.query['dates[]']
      const where: Filterable<Visit>['where'] = { officeId: req.office.id }
      if (dates?.length) {
        where.date = { [Op.in]: dates }
      } else {
        where.date = { [Op.gte]: dayjs().format(DATE_FORMAT) }
      }
      const visits = await fastify.db.Visit.findAll({ where })
      return reply.send(visits)
    }
  )

  fastify.put(
    '/visits/:visitId',
    async (
      req: FastifyRequest<{
        Params: { visitId: string }
        Body: { status: VisitStatus }
      }>,
      reply
    ) => {
      const visitId = req.params.visitId
      const status = req.body.status
      const visit = await fastify.db.Visit.findByPk(req.params.visitId)
      if (!visit) {
        return reply.throw.notFound()
      }
      req.check(Permissions.AdminManage, visit.officeId)
      await fastify.db.Visit.update({ status }, { where: { id: visitId } })
      // Send user notification to the user via Matrix
      if (fastify.integrations.Matrix) {
        const user = await fastify.db.User.findByPkActive(visit.userId)
        if (!user) {
          throw new Error(
            `Cannot send notifications about visit status change, cannot find the user: ${visit.userId}`
          )
        }
        const messageData = {
          status,
          date: dayjs(visit.date).format(DATE_FORMAT_DAY_NAME),
          office: appConfig.getOfficeById(visit.officeId),
        }

        const message = appConfig.templates.notification(
          mId,
          'visitStatusChangeByAdminForUser',
          messageData
        )
        if (message) {
          fastify.integrations.Matrix.sendMessageToUserDeferred(
            req.user,
            message
          )
        }

        const adminMessage = appConfig.templates.notification(
          mId,
          'visitStatusChangeByAdminMessage',
          {
            visitUser: user,
            adminUser: req.user,
            ...messageData,
          }
        )
        if (adminMessage) {
          fastify.integrations.Matrix.sendMessageInAdminRoomDeferred(
            adminMessage
          )
        }
      }
      // appEvents.useModule('admin').emit('update_counters')
      return reply.code(200).send()
    }
  )

  fastify.get(
    '/admin-dashboard-stats',
    async (
      req: FastifyRequest<{
        Querystring: { startDate: string; endDate: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const office = req.office
      if (!office) {
        return reply.throw.badParams('Missing office ID')
      }
      const { startDate, endDate } = req.query

      const result: VisitsAdminDashboardStats = {
        visitsTotal: 0,
        visitsToday: 0,
        topVisitors: [],
        topDesks: [],
        annualVisits: [],
        visitsByDate: [],
        areas: [],
      }

      result.visitsTotal = await fastify.db.Visit.count({
        where: {
          status: 'confirmed',
          officeId: office.id,
          date: {
            [Op.gte]: startDate,
            [Op.lte]: endDate,
          },
        },
      })
      result.visitsToday = await fastify.db.Visit.count({
        where: {
          status: 'confirmed',
          officeId: office.id,
          date: {
            [Op.gte]: dayjs().startOf('day').toDate(),
            [Op.lte]: dayjs().endOf('day').toDate(),
          },
        },
      })

      result.topVisitors = (await fastify.db.Visit.findAll({
        where: {
          status: 'confirmed',
          officeId: office.id,
          date: {
            [Op.gte]: startDate,
            [Op.lte]: endDate,
          },
        },
        attributes: ['userId', [fn('COUNT', col('userId')), 'visits']],
        group: ['userId'],
        order: [[fn('COUNT', col('userId')), 'DESC']],
        limit: 10,
        raw: true,
      })) as unknown as VisitsAdminDashboardStats['topVisitors']
      const userIds = result.topVisitors.map(fp.prop('userId'))
      const users = await fastify.db.User.findAll({
        where: {
          id: { [Op.in]: userIds },
        },
        attributes: ['id', 'fullName', 'avatar'],
      })
      const userById = users.reduce(fp.by('id'), {})
      result.topVisitors = result.topVisitors.map((x) => {
        const user = userById[x.userId]
        return {
          ...x,
          fullName: user.fullName,
          avatar: user.avatar,
        }
      })

      result.topDesks = (await fastify.db.Visit.findAll({
        where: {
          status: 'confirmed',
          officeId: office.id,
          date: {
            [Op.gte]: startDate,
            [Op.lte]: endDate,
          },
        },
        attributes: ['areaId', 'deskId', [fn('COUNT', col('id')), 'visits']],
        group: ['areaId', 'deskId'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 10,
        raw: true,
      })) as unknown as VisitsAdminDashboardStats['topDesks']
      result.topDesks = result.topDesks.map((x) => {
        const area = office.areas?.find(fp.propEq('id', x.areaId))
        const desk = area?.desks.find(fp.propEq('id', x.deskId))
        return {
          ...x,
          areaName: area?.name || 'Unknown area',
          deskName: desk?.name || 'Unknown desk',
        }
      })

      // TODO: check if startdate and enddate contains a year
      result.annualVisits = (await fastify.db.Visit.findAll({
        where: {
          status: 'confirmed',
          officeId: office.id,
          date: {
            [Op.gte]: startDate,
            [Op.lte]: endDate,
          },
        },
        attributes: [
          [fn('to_char', col('date'), DATE_FORMAT), 'date'],
          [fn('COUNT', col('id')), 'visits'],
        ],
        group: [fn('to_char', col('date'), DATE_FORMAT)],
        order: [[col('date'), 'ASC']],
        raw: true,
      })) as unknown as VisitsAdminDashboardStats['annualVisits']

      const dateFormat =
        dayjs(endDate, DATE_FORMAT).diff(
          dayjs(startDate, DATE_FORMAT),
          'days'
        ) > 31
          ? 'YYYY-MM'
          : 'YYYY-MM-DD'

      const areas = (req.office?.areas || []).map(fp.pick(['id', 'name']))
      const areaIds = areas.map(fp.prop('id'))

      result.areas = [{ id: '__unknown', name: 'Unknown' }].concat(areas)

      result.visitsByDate = (await fastify.sequelize.query(
        `
        SELECT
          date,
          total,
          ${areaIds.join(', ')},
          (total - ${areaIds.join(' - ')}) AS "__unknown"
        FROM (
          SELECT
            to_char(v."date", :dateFormat) AS date,
            cast(COUNT(*) as integer) AS total,
            ${areaIds
              .map(
                (areaId) =>
                  `cast(COUNT(CASE WHEN v."areaId" = '${areaId}' THEN 1 ELSE NULL END) as integer) as "${areaId}"`
              )
              .join(', ')}
          FROM
            visits v
          WHERE
            1=1 AND
            v."status" = 'confirmed' AND
            v."officeId" = :officeId AND
            v."date" BETWEEN :startDate AND :endDate
          GROUP BY
            to_char(v."date", :dateFormat)
        ) AS daily_stats
        ORDER BY
          date ASC;

        `,
        {
          replacements: { dateFormat, startDate, endDate, officeId: office.id },
          type: QueryTypes.SELECT,
        }
      )) as unknown as VisitsAdminDashboardStats['visitsByDate']

      return result
    }
  )

  fastify.get('/counter', async (req, reply) => {
    if (!req.office) {
      return reply.throw.badParams('Missing office ID')
    }
    req.check(Permissions.AdminList, req.office.id)
    return fastify.db.Visit.count({
      where: {
        officeId: req.office.id,
        status: 'pending',
        date: {
          [Op.gte]: dayjs().format(DATE_FORMAT),
        },
      },
    })
  })
}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Filterable, Op } from 'sequelize'
import { appConfig } from '#server/app-config'
import { DATE_FORMAT } from '#server/constants'
import { appEvents } from '#server/utils/app-events'
import { OfficeRoom } from '#shared/types'
import {
  compareTimes,
  getAvailableRanges,
  getDateTime,
  getDateTimeInTimezone,
  getDateTimeString,
  getIntervals,
  getStartAndEndOfDayInUTC,
  intervalStep,
  isBeforeToday,
  isWeekend,
  parseTimeSlot,
  timezoneDateToUTC,
} from './helpers'
import { getRoom, getRooms, isWithinWorkingHours } from '../shared-helpers'
import { Permissions } from '../permissions'
import {
  OfficeRoomCompact,
  RoomDisplayData,
  RoomReservationRequest,
  RoomReservationStatus,
  RoomReservationUpdateRequest,
} from '../types'
import { RoomReservation } from './models'

dayjs.extend(timezone)

const RoomDisplayDeviceCookie = 'hq_room_display_device'
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000'
const mId = 'room-reservation'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/room/display',
    async (req: FastifyRequest<{ Reply: RoomDisplayData | null }>, reply) => {
      const deviceId = req.cookies[RoomDisplayDeviceCookie]
      let device = deviceId
        ? await fastify.db.RoomDisplayDevice.findByPk(deviceId)
        : null

      if (!device) {
        device = await fastify.db.RoomDisplayDevice.create()
      }

      const emptyResponse: RoomDisplayData = {
        deviceId: device.id,
        confirmed: false,
        roomName: null,
        roomId: null,
        workingHours: null,
        timezone: null,
        office: null,
        current: null,
        upcoming: [],
        usersById: {},
      }

      if (!device.confirmedAt) {
        reply.setCookie(RoomDisplayDeviceCookie, device.id, {
          path: '/',
          httpOnly: true,
        })
        return emptyResponse
      }

      const office = appConfig.getOfficeById(device.office) || {}
      const room = getRoom(office, device?.roomId)
      if (!room) {
        reply.clearCookie(RoomDisplayDeviceCookie)
        return emptyResponse
      }

      const now = dayjs().tz(office.timezone)
      const endOfDay = now.endOf('day')
      const currentReservation = await fastify.db.RoomReservation.findOne({
        where: {
          office: office.id,
          roomId: room.id,
          startDate: { [Op.lte]: now.utc().toDate() },
          endDate: { [Op.gt]: now.utc().toDate() },
          status: 'confirmed',
        },
      })
      const upcomingReservations = await fastify.db.RoomReservation.findAll({
        where: {
          office: office.id,
          roomId: room.id,
          startDate: { [Op.gte]: now.utc().toDate() },
          endDate: { [Op.lte]: endOfDay.utc().toDate() },
          status: 'confirmed',
        },
        order: ['startDate'],
      })

      let userIds: string[] = []
      ;[currentReservation, ...upcomingReservations].forEach((x) => {
        if (x) {
          if (x.creatorUserId) {
            userIds.push(x.creatorUserId)
          }
          userIds = userIds.concat(x.userIds)
        }
      })
      // look for inactive users too in case some future reservations are made by users who are not active anymore
      const users = await fastify.db.User.findAll({
        where: {
          id: { [Op.in]: userIds },
        },
        attributes: ['fullName', 'avatar', 'id'],
      })
      const usersById = users.reduce((acc, x) => ({ ...acc, [x.id]: x }), {})

      const result: RoomDisplayData = {
        deviceId: device.id,
        confirmed: true,
        roomName: room.name,
        workingHours: room.workingHours,
        office: office.id,
        roomId: room.id,
        timezone: office.timezone,
        current: currentReservation,
        upcoming: upcomingReservations,
        usersById,
      }
      return result
    }
  )

  fastify.put(
    '/:reservationId/duration',
    async (
      req: FastifyRequest<{
        Params: { reservationId: string }
      }>,
      reply
    ) => {
      const id = req.params.reservationId
      const deviceId = req.cookies[RoomDisplayDeviceCookie]

      let device = deviceId
        ? await fastify.db.RoomDisplayDevice.findByPk(deviceId)
        : null

      if (!device) {
        return reply.throw.notFound()
      }

      if (!device.confirmedAt) {
        return reply.throw.rejected('Device has not been confirmed yet.')
      }

      const reservation = await fastify.db.RoomReservation.findOne({
        where: {
          id: req.params.reservationId,
        },
      })
      if (!reservation) {
        return reply.throw.notFound()
      }
      await fastify.db.RoomReservation.update(
        { endDate: dayjs().toDate() },
        { where: { id } }
      )
      return reply.ok()
    }
  )

  fastify.post(
    '/room-reservations',
    async (
      req: FastifyRequest<{
        Querystring: { office: string }
        Body: RoomReservationRequest
      }>,
      reply
    ) => {
      const deviceId = req.cookies[RoomDisplayDeviceCookie]

      let device = deviceId
        ? await fastify.db.RoomDisplayDevice.findByPk(deviceId)
        : null

      if (!device || !req.query.office) {
        return reply.throw.notFound()
      }

      if (!device.confirmedAt) {
        return reply.throw.rejected('Device has not been confirmed yet.')
      }
      const data = req.body
      const officeId = req.query?.office
      const office = appConfig.getOfficeById(officeId)
      const room = getRoom(office, data.roomId)
      if (!room) {
        return reply.throw.badParams('Invalid room ID')
      }
      // @todo isWeekend -> get office working days data from the config
      if (isWeekend(data.date)) {
        return reply.throw.badParams('Cannot make reservation on the weekend.')
      }
      if (isBeforeToday(data.date)) {
        return reply.throw.badParams('The reservations has to be before today.')
      }
      if (!isWithinWorkingHours(data.timeSlot, room.workingHours)) {
        return reply.throw.badParams(
          'The reservations has to be within room working hours.'
        )
      }
      // all reservations made from tablet are automatically confirmed regardless of the room settings
      const status = 'confirmed'
      const time: Array<string> = data.timeSlot.split(' - ')
      const start = timezoneDateToUTC(data.date, time[0], office.timezone)
      const end = timezoneDateToUTC(data.date, time[1], office.timezone)

      const existingReservation = await fastify.db.RoomReservation.findOne({
        where: {
          office: office.id,
          startDate: start.format(),
          endDate: end.format(),
          roomId: data.roomId,
          status: { [Op.in]: ['confirmed', 'pending'] },
        },
      })
      if (existingReservation) {
        return reply.throw.conflict(
          'Please try another room or another time. This room is already reserved.'
        )
      }

      await fastify.db.RoomReservation.create({
        userIds: [TEMP_USER_ID],
        creatorUserId: TEMP_USER_ID,
        office: office.id,
        startDate: start.toDate(),
        endDate: end.toDate(),
        roomId: data.roomId,
        status: status,
      })

      return reply.ok()
    }
  )
}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/time-slots/rooms',
    async (
      req: FastifyRequest<{
        Querystring: { slot: string; date: string }
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Invalid office ID')
      }
      req.check(Permissions.Create, req.office.id)
      if (!req.query.slot) {
        return reply.throw.badParams('Specify time slot')
      }
      // @todo isWeekend -> get office working days data from the config
      if (isWeekend(req.query.date) || isBeforeToday(req.query.date)) {
        return []
      }
      const { startT, endT } = parseTimeSlot(req.query.slot)
      const start = getDateTimeInTimezone(
        req.office.timezone,
        startT,
        req.query.date
      ).utc()
      const end = getDateTimeInTimezone(
        req.office.timezone,
        endT,
        req.query.date
      ).utc()

      const isBetweenNotIncludingBounds = {
        [Op.gt]: start.toISOString(),
        [Op.lt]: end.toISOString(),
      }

      // get all reservations that overlap with the chosen timeSlot
      const reservations = await fastify.db.RoomReservation.findAll({
        attributes: ['roomId', 'startDate', 'endDate'],
        where: {
          office: req.office.id,
          [Op.or]: [
            {
              startDate: isBetweenNotIncludingBounds,
            },
            {
              endDate: isBetweenNotIncludingBounds,
            },
            {
              [Op.and]: [
                { startDate: { [Op.lt]: end.toISOString() } },
                { endDate: { [Op.gt]: start.toISOString() } },
              ],
            },
            {
              [Op.and]: [
                { startDate: { [Op.gte]: start.toISOString() } },
                { endDate: { [Op.lte]: end.toISOString() } },
              ],
            },
          ],
          status: { [Op.in]: ['confirmed', 'pending'] },
        },
      })
      const reservedRooms = reservations.map((room) => room.roomId)

      return (getRooms(office) || []).filter((room) => {
        if (!room) {
          return false
        }
        return (
          room.available &&
          !reservedRooms.includes(room.id) &&
          isWithinWorkingHours(req.query.slot, room.workingHours)
        )
      })
    }
  )

  fastify.get(
    '/rooms/:roomId/time-slots',
    async (
      req: FastifyRequest<{
        Params: { roomId: string }
        Querystring: { duration: number; date: string }
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Invalid office ID')
      }
      req.check(Permissions.Create, req.office.id)
      if (!req.params.roomId) {
        return reply.throw.badParams('Invalid room ID')
      }
      if (!req.query.date) {
        return reply.throw.badParams('Missing date')
      }
      // @todo isWeekend -> get office working days data from the config
      if (isWeekend(req.query.date) || isBeforeToday(req.query.date)) {
        return []
      }
      const requestedDuration = req.query.duration ?? 30
      const office = req.office
      const room = office.rooms!.find((room) => room.id === req.params.roomId)
      if (!room || !room.available) {
        return reply.throw.badParams('Invalid room ID')
      }
      const roomWorkingHours = room.workingHours ?? ['08:00', '19:00']

      // UTC start and date because we want to query the database where we save datetime in UTC

      const { startOfDayUTC, endOfDayUTC } = getStartAndEndOfDayInUTC(
        req.query.date,
        office.timezone
      )

      const allReservationsToday = await fastify.db.RoomReservation.findAll({
        where: {
          status: { [Op.in]: ['confirmed', 'pending'] },
          roomId: req.params.roomId,
          startDate: {
            [Op.gte]: startOfDayUTC.format(),
          },
          endDate: {
            [Op.lte]: endOfDayUTC.format(),
          },
        },
      })

      const now = dayjs().tz(office.timezone)
      const roomWorkingHoursStart = roomWorkingHours[0].split(':')
      let startDateTime = getDateTime(roomWorkingHoursStart)

      if (
        dayjs(req.query.date).isSame(now, 'day') &&
        dayjs(startDateTime).isBefore(now)
      ) {
        startDateTime = getDateTime(
          dayjs().tz(office.timezone).format('HH:mm').split(':')
        )
      }

      const durationIntervals = getIntervals(
        startDateTime,
        getDateTime(roomWorkingHours[1].split(':')),
        requestedDuration
      )

      let occupiedIntervals: Array<string> = []
      allReservationsToday.forEach((reservation) => {
        const startDate = dayjs.utc(reservation.startDate).tz(office.timezone)
        const endDate = dayjs.utc(reservation.endDate).tz(office.timezone)
        const timeDifference = endDate.diff(startDate, 'minute')

        if (timeDifference < intervalStep && endDate.isAfter(now)) {
          occupiedIntervals = occupiedIntervals.concat([
            `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}`,
          ])
        }
        occupiedIntervals = occupiedIntervals.concat(
          getIntervals(startDate, endDate)
        )
      })

      return getAvailableRanges(
        durationIntervals,
        office.timezone,
        occupiedIntervals
      )
    }
  )

  fastify.get(
    '/placeholder',
    async (
      req: FastifyRequest<{
        Querystring: { duration?: number }
      }>,
      reply
    ) => {
      req.check(Permissions.Create)
      if (!req.office) {
        return reply.throw.badParams('Invalid office ID')
      }
      return req.office.roomsPlaceholderMessage ?? ''
    }
  )

  fastify.get(
    '/time-slots',
    async (
      req: FastifyRequest<{
        Querystring: { duration?: number; date: string }
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Invalid office ID')
      }
      req.check(Permissions.Create, req.office.id)
      if (!req.query.date) {
        return reply.throw.badParams('Missing date')
      }
      // @todo isWeekend -> get office working days data from the config
      if (isWeekend(req.query.date) || isBeforeToday(req.query.date)) {
        return []
      }
      const requestedDuration = req.query.duration ?? 30
      const office = req.office
      let earliestStart: Array<string> = []
      let latestEnd: Array<string> = []
      const rooms = (office.rooms || []).filter((room) => room.available)
      rooms.forEach((room) => {
        const [workingHoursStart, workingHoursEnd] = room.workingHours.map(
          (time) => time.split(':')
        )
        if (
          !earliestStart.length ||
          compareTimes(workingHoursStart, earliestStart) === -1
        ) {
          earliestStart = workingHoursStart
        }

        if (
          !latestEnd.length ||
          compareTimes(workingHoursEnd, latestEnd) === 1
        ) {
          latestEnd = workingHoursEnd
        }
      })

      const now = dayjs().tz(office.timezone)
      if (
        dayjs(req.query.date).isSame(now, 'day') &&
        dayjs(getDateTime(earliestStart)).isBefore(now)
      ) {
        earliestStart = dayjs().tz(office.timezone).format('HH:mm').split(':')
      }

      // find latest working hour open time
      const start = getDateTimeInTimezone(
        office.timezone,
        earliestStart,
        req.query.date
      )
      const end = getDateTimeInTimezone(
        office.timezone,
        latestEnd,
        req.query.date
      )
      const roomCount = rooms.length

      if (!roomCount) {
        return []
      }

      const durationIntervals = getIntervals(start, end, requestedDuration)

      const allReservationsToday = await fastify.db.RoomReservation.findAll({
        where: {
          status: { [Op.in]: ['confirmed', 'pending'] },
          office: office.id,
          startDate: {
            [Op.gt]: start,
          },
          endDate: {
            [Op.lt]: end,
          },
        },
      })

      let occupiedIntervals: Array<string> = []
      allReservationsToday.forEach(
        (reservation) =>
          (occupiedIntervals = occupiedIntervals.concat(
            getIntervals(
              getDateTimeInTimezone(office.timezone, [
                reservation.startDate.getHours().toString(),
                reservation.startDate.getMinutes().toString(),
              ]),

              getDateTimeInTimezone(office.timezone, [
                reservation.endDate.getHours().toString(),
                reservation.endDate.getMinutes().toString(),
              ])
            )
          ))
      )

      // only the time slots that have been occupied for all rooms are taken
      const timeSlotCount: Record<string, number> = {}
      occupiedIntervals.forEach((interval) => {
        if (timeSlotCount.hasOwnProperty(interval)) {
          timeSlotCount[interval]++
        } else {
          timeSlotCount[interval] = 1
        }
      })

      const occupiedTimeSlotsForAllRooms: Array<string> = []
      for (let slot in timeSlotCount) {
        if (timeSlotCount[slot] === roomCount) {
          occupiedTimeSlotsForAllRooms.push(slot)
        }
      }

      return getAvailableRanges(
        durationIntervals,
        office.timezone,
        occupiedTimeSlotsForAllRooms
      )
    }
  )

  fastify.get(
    '/room',
    async (
      req: FastifyRequest<{ Querystring: { allRooms: 'true' | undefined } }>,
      reply
    ) => {
      req.check(Permissions.Create)
      if (req.office) {
        const rooms = req.office.rooms || []
        return req.query.allRooms ? rooms : rooms.filter((x) => x.available)
      }
      const rooms = appConfig.offices
        .map((x) => x.rooms)
        .flat()
        .filter(Boolean)
      return req.query.allRooms ? rooms : rooms.filter((x) => x?.available)
    }
  )

  fastify.get(
    '/room/:roomId/occupancy',
    async (
      req: FastifyRequest<{
        Params: { roomId: string }
        Querystring: { date: string }
        Reply: string[][]
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Invalid office ID')
      }
      req.check(Permissions.Create, req.office.id)
      const room = req.office.rooms!.find((x) => x.id === req.params.roomId)
      if (!room || !room.available) {
        return reply.throw.badParams('Invalid room ID')
      }

      const date = dayjs(req.query.date, DATE_FORMAT).tz(
        req.office.timezone,
        true
      )
      const startDateEdge = date.startOf('day').utc()
      const endDateEdge = date.endOf('day').utc()

      const reservations = await fastify.db.RoomReservation.findAll({
        where: {
          roomId: room.id,
          office: req.office.id,
          startDate: { [Op.gte]: startDateEdge.toDate() },
          endDate: { [Op.lte]: endDateEdge.toDate() },
          status: 'confirmed',
        },
      })
      return reservations.map((x) => [
        dayjs(x.startDate).tz(req.office?.timezone).format('HH:mm'),
        dayjs(x.endDate).tz(req.office?.timezone).format('HH:mm'),
      ])
    }
  )

  fastify.post(
    '/room-reservations',
    async (req: FastifyRequest<{ Body: RoomReservationRequest }>, reply) => {
      if (!req.office) {
        return reply.throw.badParams('Invalid office ID')
      }
      req.check(Permissions.Create, req.office.id)
      const data = req.body
      const room = (req.office.rooms || []).find((x) => x.id === data.roomId)
      if (!room || !room.available) {
        return reply.throw.badParams('Invalid room ID')
      }
      // @todo isWeekend -> get office working days data from the config
      if (isWeekend(data.date)) {
        return reply.throw.badParams('Cannot make reservation on the weekend.')
      }
      if (isBeforeToday(data.date)) {
        return reply.throw.badParams('The reservations has to be before today.')
      }
      if (!isWithinWorkingHours(data.timeSlot, room.workingHours)) {
        return reply.throw.badParams(
          'The reservations has to be within room working hours.'
        )
      }
      const status = room?.autoConfirm ? 'confirmed' : 'pending'
      const time: Array<string> = data.timeSlot.split(' - ')
      const start = timezoneDateToUTC(data.date, time[0], req.office.timezone)
      const end = timezoneDateToUTC(data.date, time[1], req.office.timezone)

      const existingReservation = await fastify.db.RoomReservation.findOne({
        where: {
          office: req.office.id,
          startDate: start.format(),
          endDate: end.format(),
          roomId: data.roomId,
          status: { [Op.in]: ['confirmed', 'pending'] },
        },
      })
      if (existingReservation) {
        return reply.throw.conflict(
          'Please try another room or another time. This room is already reserved.'
        )
      }

      const reservation = await fastify.db.RoomReservation.create({
        userIds: [req.user.id],
        creatorUserId: req.user.id,
        office: req.office.id,
        startDate: start.toDate(),
        endDate: end.toDate(),
        roomId: data.roomId,
        status: status,
      })

      // Send user notification to the user via Matrix
      if (fastify.integrations.Matrix) {
        const office = appConfig.getOfficeById(reservation.office)
        const data = {
          status,
          user: req.user.usePublicProfileView(),
          date: getDateTimeString(reservation, office.timezone),
          room: room ? room.name : reservation.roomId,
          office: appConfig.getOfficeById(office.id),
        }
        const message = appConfig.templates.notification(
          mId,
          'newReservation',
          data
        )
        if (message) {
          fastify.integrations.Matrix.sendMessageToUserDeferred(
            req.user,
            message
          )
        }
        const adminMessage = appConfig.templates.notification(
          mId,
          'newReservationAdmin',
          data
        )
        if (adminMessage) {
          fastify.integrations.Matrix.sendMessageInAdminRoomDeferred(
            adminMessage
          )
        }
      }
      return reply.ok()
    }
  )

  fastify.get('/room-reservation', async (req, reply) => {
    if (!req.office) {
      return reply.throw.badParams('Invalid office ID')
    }
    req.check(Permissions.Create, req.office.id)
    const reservations = await fastify.db.RoomReservation.findAll({
      where: {
        office: req.office.id,
        [Op.or]: [
          { creatorUserId: req.user.id },
          { userIds: { [Op.contains]: [req.user.id] } },
        ],
        endDate: { [Op.gte]: dayjs().utc().toDate() },
      },
      order: ['startDate'],
    })
    return reservations
  })

  fastify.put(
    '/:reservationId',
    async (
      req: FastifyRequest<{
        Params: { reservationId: string }
        Body: { status: RoomReservationStatus }
      }>,
      reply
    ) => {
      const id = req.params.reservationId
      const status = req.body.status
      const reservation = await fastify.db.RoomReservation.findOne({
        where: {
          id,
          creatorUserId: req.user.id,
        },
      })
      if (!reservation) {
        return reply.throw.notFound()
      }
      req.check(Permissions.Create, reservation.office)

      if (
        reservation.status !== 'confirmed' &&
        req.body.status !== ('cancelled' as RoomReservationStatus)
      ) {
        return reply.throw.rejected()
      }

      await fastify.db.RoomReservation.update({ status }, { where: { id } })

      // Send user notification to the user via Matrix
      if (fastify.integrations.Matrix) {
        const office = appConfig.getOfficeById(reservation.office)
        const room = getRoom(office, reservation.roomId)
        const data = {
          status,
          user: req.user.usePublicProfileView(),
          date: getDateTimeString(reservation, office.timezone),
          room: room ? room.name : reservation.roomId,
          office: appConfig.getOfficeById(reservation.office),
        }

        const message = appConfig.templates.notification(
          mId,
          'reservationStatusChange',
          data
        )
        if (message) {
          fastify.integrations.Matrix.sendMessageToUserDeferred(
            req.user,
            message
          )
        }

        const adminMessage = appConfig.templates.notification(
          mId,
          'reservationStatusChangeAdmin',
          data
        )
        if (adminMessage) {
          fastify.integrations.Matrix.sendMessageInAdminRoomDeferred(
            adminMessage
          )
        }
      }

      return reply.ok()
    }
  )

  fastify.get(
    '/room-reservation/:reservationId',
    async (
      req: FastifyRequest<{
        Body: RoomReservationUpdateRequest
        Params: { reservationId: string }
      }>,
      reply
    ) => {
      const reservation = await fastify.db.RoomReservation.findByPk(
        req.params.reservationId
      )
      if (!reservation) {
        return reply.throw.notFound()
      }

      if (
        req.user.id !== reservation.creatorUserId &&
        !req.can(Permissions.AdminList, reservation.office)
      ) {
        return reply.throw.accessDenied()
      } else {
        req.check(Permissions.Create, reservation.office)
      }

      const office = appConfig.getOfficeById(reservation.office) || {}
      const roomDetail = getRoom(office, reservation.roomId)
      return {
        id: reservation.id,
        status: reservation.status,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        creatorUserId: reservation.creatorUserId,
        roomDetail,
        officeName: office?.name ?? '',
      }
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.put(
    '/device/:deviceId',
    async (
      req: FastifyRequest<{
        Body: { roomId: string }
        Params: { deviceId: string }
      }>,
      reply
    ) => {
      if (!req.permissions.hasRoot(Permissions.AdminManage)) {
        return reply.throw.accessDenied()
      }
      const device = await fastify.db.RoomDisplayDevice.findByPk(
        req.params.deviceId
      )
      if (!device) {
        return reply.throw.notFound()
      }
      if (device.confirmedAt) {
        return reply.throw.rejected('The device is already confirmed')
      }
      const roomId = req.body.roomId
      const office = appConfig.offices.find((o) =>
        (getRooms(o) || []).some((r) => r.id === roomId)
      )
      if (!office) {
        return reply.throw.rejected("Can't resolve a submitted room ID")
      }
      await device
        .set({
          confirmedAt: new Date(),
          confirmedByUserId: req.user.id,
          office: office.id,
          roomId,
        })
        .save()
      return reply.ok()
    }
  )

  fastify.get('/room-reservation', async (req, reply) => {
    if (!req.office) {
      return reply.throw.badParams('Invalid office ID')
    }
    req.check(Permissions.AdminList, req.office.id)
    const reservations = await fastify.db.RoomReservation.findAll({
      where: {
        office: req.office.id,
      },
      order: [['startDate', 'DESC']],
    })
    return reservations
  })

  fastify.put(
    '/room-reservation/:reservationId',
    async (
      req: FastifyRequest<{
        Body: RoomReservationUpdateRequest
        Params: { reservationId: string }
      }>,
      reply
    ) => {
      const reservation = await fastify.db.RoomReservation.findByPk(
        req.params.reservationId
      )
      if (!reservation) {
        return reply.throw.notFound()
      }
      req.check(Permissions.AdminManage, reservation.office)
      await reservation
        .set({
          status: req.body.status,
        })
        .save()
      // appEvents.useModule('admin').emit('update_counters')
      // Send user notification to the user via Matrix
      if (req.body.status === 'cancelled' && fastify.integrations.Matrix) {
        process.nextTick(async () => {
          try {
            const office = appConfig.getOfficeById(reservation.office)
            const room = getRoom(office, reservation.roomId)
            const data = {
              room: room ? room.name : reservation.roomId,
              date: getDateTimeString(reservation, office.timezone),
              office,
            }
            const message = appConfig.templates.notification(
              mId,
              'reservationCancelledForUser',
              data
            )
            if (message) {
              fastify.integrations.Matrix.sendMessageToUserDeferred(
                req.user,
                message
              )
            }
            const adminMessage = appConfig.templates.notification(
              mId,
              'reservationStatusChangeAdmin',
              {
                status: req.body.status,
                user: req.user.usePublicProfileView(),
                ...data,
              }
            )
            if (adminMessage) {
              fastify.integrations.Matrix.sendMessageInAdminRoomDeferred(
                adminMessage
              )
            }
          } catch (err) {
            fastify.log.error(err)
          }
        })
      }
      return reply.ok()
    }
  )

  fastify.get('/room', async (req, reply) => {
    if (!req.permissions.hasRoot(Permissions.AdminManage)) {
      return reply.throw.accessDenied()
    }
    const officeIds = req.permissions.extractOfficeIds(Permissions.AdminManage)
    if (!officeIds) {
      return reply.throw.accessDenied()
    }
    return appConfig.offices
      .filter((x) => (officeIds.length ? officeIds.includes(x.id) : true))
      .reduce<OfficeRoomCompact[]>((acc, x) => {
        const rooms = (x.rooms || []).map((r) => ({
          id: r.id,
          name: r.name,
          officeId: x.id,
        }))
        return [...acc, ...rooms]
      }, [])
  })
}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}

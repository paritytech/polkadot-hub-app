import dayjs from 'dayjs'
import { DATE_FORMAT } from '#server/constants'
import { RoomReservation } from '#modules/room-reservation/server/models'
import { DailyEventType, User, Visit, VisitType } from '#shared/types'
import { appConfig } from '#server/app-config'
import { FastifyInstance } from 'fastify'
import { Op } from 'sequelize'

export const BUSINESS_DAYS_LIMIT: number = 40

// FIXME: temporary fix
export const getDate = (d: string, timezone?: string) =>
  dayjs(d).format(DATE_FORMAT)

// export const getDate = (d: string, timezone: string) =>
//   dayjs(d).tz(timezone).format(DATE_FORMAT).toString()

export const getTime = (date: string | Date) => dayjs(date).format('LT')

export const getBusinessDaysFromDate = (
  date: string,
  businessDaysLimit = BUSINESS_DAYS_LIMIT
) => {
  const dates = []
  const theDate = date ? dayjs(date) : dayjs()

  if (theDate.day() !== 6 && theDate.day() !== 0) {
    dates.push(theDate.format(DATE_FORMAT))
  }

  let nextDate = theDate.add(1, 'day')

  while (dates.length < businessDaysLimit) {
    if (nextDate.day() !== 6 && nextDate.day() !== 0) {
      dates.push(nextDate.format(DATE_FORMAT))
    }
    nextDate = nextDate.add(nextDate.day() === 5 ? 3 : 1, 'day')
  }

  return dates
}

export const formatRoomReservationsResult = (
  reservation: RoomReservation,
  officeId: string
): any => {
  const office = appConfig.offices.find((o) => o.id === officeId)
  const officeRoom = (office?.rooms || []).find(
    (r) => r.id === reservation.roomId
  )
  return {
    id: reservation.id,
    dateTime: `${getTime(reservation.startDate)} - ${getTime(
      reservation.endDate
    )}`,
    date: dayjs(reservation.startDate).format('YYYY-MM-DD'),
    value: 'Room ' + officeRoom?.name ?? '',
    description: officeRoom?.description ?? '',
    type: VisitType.RoomReservation,
    status: reservation.status,
  }
}

export const formatVisit = (v: Visit, user?: User | null): any => {
  return {
    id: v.id,
    value: `Desk ${v.deskName}`,
    type: VisitType.Visit,
    deskId: v.deskId,
    description: v.areaName,
    areaId: v.areaId,
    date: v.date,
    status: v.status,
    userId: v.userId,
    user: user
      ? {
          id: user?.id,
          avatar: user?.avatar,
        }
      : null,
  }
}

export const getVisits = async (
  fastify: FastifyInstance,
  officeId: string,
  date: string,
  userId: string
) => {
  const q = {
    officeId,
    status: {
      [Op.in]: ['confirmed', 'pending'],
    },
    date: {
      [Op.gte]: dayjs(date).toDate(),
    },
  }
  if (userId) {
    q['userId'] = userId
  }
  return fastify.db.Visit.findAll({
    where: q,
    order: ['date'],
  })
}

export const getRoomReservations = async (
  fastify: FastifyInstance,
  officeId: string,
  creatorUserId: string,
  date: string
) => {
  return fastify.db.RoomReservation.findAll({
    where: {
      office: officeId,
      creatorUserId,
      status: {
        [Op.in]: ['confirmed', 'pending'],
      },
      startDate: {
        [Op.gte]: dayjs(date).toDate(),
      },
    },
    order: ['startDate'],
  })
}

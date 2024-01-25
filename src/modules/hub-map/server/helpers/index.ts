import { appConfig } from '#server/app-config'
import { DATE_FORMAT } from '#server/constants'
import { Event, RoomReservation, User, Visit, VisitType } from '#shared/types'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { Op } from 'sequelize'

export const getTime = (date: string | Date) => dayjs(date).format('LT')

export const formatRoomReservationsResult = (
  reservation: RoomReservation,
  officeId: string,
  areaId: string
): any => {
  // @todo put this somewhere central
  const office = appConfig.offices.find((o) => o.id === officeId)
  const area = office?.areas?.find((a) => a.id === areaId)
  const officeRoom = area?.meetingRooms?.find(
    (m) => m.id === reservation.roomId
  )
  return {
    id: reservation.id,
    dateTime: `${getTime(reservation.startDate)} - ${getTime(
      reservation.endDate
    )}`,
    objectId: reservation.roomId,
    areaId,
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
    objectId: v.deskId,
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

export const formatEvent = (event: Event) => {
  const url = `/event/${event.id}`
  const now = dayjs()
  const start = dayjs(event.startDate)
  const end = dayjs(event.endDate)
  const isToday = now >= start && now <= end
  const isSingleDay = start.isSame(end, 'day')

  return {
    id: event.id,
    value: event.title,
    url: url,
    // @todo add different types
    type: 'event',
    date: start.format(DATE_FORMAT),
    description: isToday
      ? 'Today'
      : isSingleDay
      ? event.startDate
      : `${start.format(DATE_FORMAT)} - ${end.format(DATE_FORMAT)}`,
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

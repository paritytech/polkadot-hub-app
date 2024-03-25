import { GuestInvite } from '#modules/guest-invites/server/models'
import { ScheduledItemType } from '#modules/hub-map/types'
import { appConfig } from '#server/app-config'
import { DATE_FORMAT, FRIENDLY_DATE_FORMAT_SHORT } from '#server/constants'
import {
  Event,
  EventApplicationStatus,
  RoomReservation,
  User,
  Visit,
  VisitType,
} from '#shared/types'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { Op } from 'sequelize'
import { Filterable } from 'sequelize'

export const getTime = (date: string | Date, tz: string) =>
  dayjs(date).tz(tz).format('LT')

export const getDate = (d: string) => dayjs(d).format(DATE_FORMAT)

export const formatRoomReservationsResult = (
  reservation: RoomReservation,
  officeId: string,
  areaId: string | undefined
): any => {
  // @todo put this somewhere central
  const office = appConfig.offices.find((o) => o.id === officeId)
  const area = office?.areas?.find((a) => a.id === areaId)
  const officeRoom = area?.meetingRooms?.find(
    (m) => m.id === reservation.roomId
  )
  return {
    id: reservation.id,
    extraInformation: `${getTime(
      reservation.startDate,
      office?.timezone || ''
    )} - ${getTime(reservation.endDate, office?.timezone || '')}`,
    objectId: reservation.roomId,
    areaId,
    date: dayjs(reservation.startDate)
      .tz(office?.timezone)
      .format('YYYY-MM-DD'),
    value: 'Room ' + officeRoom?.name ?? '',
    description: officeRoom?.description ?? '',
    type: VisitType.RoomReservation,
    status: reservation.status,
  }
}

export const formatGuestInvite = (
  g: GuestInvite & { date: string },
  v: Visit
): ScheduledItemType => {
  return {
    id: v.id,
    value: g.fullName,
    type: VisitType.Guest,
    date: g.date,
    dates: g.dates,
    description: `Desk ${v.deskName} - ${v.areaName}`,
    extraInformation: `Guest visit`,
    areaId: v.areaId,
    objectId: v.deskId,
    status: g.status,
  }
}

export const formatVisit = (
  v: Visit,
  user?: User | null
): ScheduledItemType &
  (User | { id: string; avatar: string | null }) & { guestInvite: boolean } => {
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

export const formatEvent = (
  event: Event,
  applicationStatus: EventApplicationStatus,
  complete: boolean
) => {
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
    status: applicationStatus,
    date: start.format(DATE_FORMAT),
    complete: complete,
    description: isToday
      ? 'Today'
      : isSingleDay
      ? event.startDate
      : `${start.format(FRIENDLY_DATE_FORMAT_SHORT)} - ${end.format(
          FRIENDLY_DATE_FORMAT_SHORT
        )}`,
  }
}

export const getVisits = async (
  fastify: FastifyInstance,
  officeId: string,
  date: string,
  userId: string
) => {
  const where: Filterable<Visit>['where'] = {
    officeId,
    status: {
      [Op.in]: ['confirmed', 'pending'],
    },
    date: {
      [Op.gte]: dayjs(date).toDate(),
    },
  }
  if (userId) {
    where['userId'] = userId
  }
  return fastify.db.Visit.findAll({
    where,
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

import dayjs from 'dayjs'
import { DATE_FORMAT } from '#server/constants'
import { RoomReservation } from '#modules/room-reservation/server/models'
import { ScheduledItemType, User, Visit, VisitType } from '#shared/types'
import { appConfig } from '#server/app-config'

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

export const formatVisit = (
  v: Visit,
  user?: User | null
): ScheduledItemType => {
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

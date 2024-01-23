import config from '#client/config'
import { DATE_FORMAT } from '#client/constants'
import {
  OfficeArea,
  OfficeAreaDesk,
  OfficeRoom,
  VisitType,
} from '#shared/types'
import { Dayjs } from 'dayjs'

export const getPoints = (area: OfficeArea) => {
  const points: Array<OfficeAreaDesk | OfficeRoom> = [
    ...area?.desks.map((desk) => ({
      ...desk,
      areaId: area.id,
      kind: VisitType.Visit,
    })),
  ]
  if (!!area?.meetingRooms?.length) {
    points.push(
      ...area?.meetingRooms.map((room) => ({
        ...room,
        areaId: area.id,
        kind: VisitType.RoomReservation,
      }))
    )
  }
  return points
}

export const goToVisits = (
  selectedDesk: string,
  areaId: string,
  date: Dayjs
) => {
  const url = new URL(config.appHost + '/visits/request')
  url.searchParams.set('deskId', String(selectedDesk))
  url.searchParams.set('areaId', String(areaId))
  url.searchParams.set('date', date.format(DATE_FORMAT))
  window.location.href = url.toString()
}

export const goToMeetings = (roomId: string, date: Dayjs) => {
  const url = new URL(config.appHost + '/room-reservation/request')
  url.searchParams.set('roomId', String(roomId))
  url.searchParams.set('date', date.format(DATE_FORMAT))
  url.hash = String(roomId)
  window.location.href = url.toString()
}

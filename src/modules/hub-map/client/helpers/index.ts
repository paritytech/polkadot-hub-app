import config from '#client/config'
import { DATE_FORMAT } from '#client/constants'
import {
  OfficeArea,
  OfficeAreaDesk,
  OfficeRoom,
  VisitType,
} from '#shared/types'
import { Dayjs } from 'dayjs'

export const addParams = (
  arr: Array<OfficeAreaDesk> | Array<OfficeRoom>,
  params: { kind: string; areaId: string }
) => {
  if (!arr.length) {
    return []
  }
  return arr.map((item) => ({
    ...item,
    ...params,
  }))
}

export const getPoints = (area: OfficeArea) => {
  const points = [
    ...addParams(area?.desks, {
      areaId: area.id,
      kind: VisitType.Visit,
    }),
  ]
  if (!!area?.meetingRooms?.length) {
    points.push(
      ...addParams(area?.meetingRooms, {
        areaId: area.id,
        kind: VisitType.RoomReservation,
      })
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

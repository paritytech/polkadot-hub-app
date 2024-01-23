import config from '#client/config'
import { DATE_FORMAT } from '#client/constants'
import { Dayjs } from 'dayjs'

export const assignKind = (arr: Array<any>, kind: string) => {
  if (!arr.length) {
    return []
  }
  return arr.map((item) => {
    item.kind = kind
    return item
  })
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

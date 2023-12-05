import { VisitType } from '#shared/types'

export const PAGE_SIZE = 5

export const RESERVATION_TYPES: Record<string, string> = {
  [VisitType.Visit]: 'office visit',
  [VisitType.RoomReservation]: 'room reservation',
  [VisitType.Guest]: 'guest invite',
}

export const paginateObject = (
  entries: Object,
  page: number,
  pageSize: number
) => {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const entriesArr = Object.entries(entries) // convert object to array of key-value pairs
  const slicedArr = entriesArr.slice(startIndex, endIndex) // slice the array
  return Object.fromEntries(slicedArr)
}

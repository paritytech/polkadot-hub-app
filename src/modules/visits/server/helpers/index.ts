import dayjs from 'dayjs'
import { OfficeArea, OfficeAreaDesk, Office } from '#server/app-config/types'
import { DATE_FORMAT } from '#server/constants'
import { AreaDeskPair, PickedVisit, Visit } from '../../types'

const getConfigurationForDesk = (
  config: Office,
  deskId: string,
  area: string
): OfficeAreaDesk | undefined =>
  (config.areas || [])
    .find((a) => a.id === area)
    ?.desks?.find((d) => d.id === deskId)

/**
 * Checks new visits against the existing visits
 * @param newVisits
 * @param visits
 * @param office
 * @returns
 */
export const getConflictedVisits = (
  newVisits: Visit[],
  visits: PickedVisit[],
  office: Office
): Visit[] =>
  newVisits.filter((ev: Visit) =>
    visits.some(
      (v: PickedVisit) =>
        v.deskId === ev.deskId &&
        v.areaId === ev.areaId &&
        dayjs(v.date).format(DATE_FORMAT) === ev.date &&
        !getConfigurationForDesk(office, v.deskId, v.areaId)
          ?.allowMultipleBookings
    )
  )

export const getReservedAreaIds = (
  visits: Visit[],
  bookablePairs: Array<AreaDeskPair | null>
): string[] =>
  visits
    .filter((v) =>
      bookablePairs.some((x) => x?.areaId === v.areaId && x.deskId === v.deskId)
    )
    .map((v) => v.areaId)

/**
 * Returns all the areas for the current office which can be fully booked
 * @param areas
 * @returns
 */
export const getFullBookableAreas = (
  areas: OfficeArea[]
): Array<AreaDeskPair | null> =>
  areas
    .filter((a) => a.bookable)
    .map((a) => {
      const desk = a.desks.find((d) => d.fullAreaBooking)
      return desk ? { areaId: a.id, deskId: desk.id } : null
    })
    .filter(Boolean)

export function sortByDate(array: any, field: any): Array<any> | null {
  if (!array.length || !field) {
    return null
  }
  return array.sort((a: string, b: string) =>
    dayjs(a[field]).isAfter(dayjs(b[field])) ? 1 : -1
  )
}

export const mapJoin = (arr: string[]) => arr.map((x) => `"${x}"`).join(', ')

import dayjs from 'dayjs'
import { DATE_FORMAT } from '#server/constants'

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

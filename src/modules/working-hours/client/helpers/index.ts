import dayjs, { Dayjs } from 'dayjs'
import { DATE_FORMAT } from '#client/constants'
import {
  PublicHoliday,
  TimeOffRequest,
  WorkingHoursConfig,
  WorkingHoursEntryCreationRequest,
} from '#shared/types'
import * as fp from '#shared/utils/fp'
import { TimeOff, getEditableDaysSet } from '../../shared-helpers'

export const SHOULD_USE_12H_CYCLE = (() => {
  const formatOptions = Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
  }).resolvedOptions()
  // @ts-ignore
  return (formatOptions?.hourCycle || '') === 'h12'
})()

export function getTodayDate(): string {
  return dayjs().startOf('day').format(DATE_FORMAT)
}

export function prefillWithDefaults(
  mode: 'day' | 'week',
  date: Dayjs, // any day of the week if mode == 'week'
  config: WorkingHoursConfig,
  timeOffRequests: TimeOffRequest[],
  publicHolidays: PublicHoliday[]
): WorkingHoursEntryCreationRequest[] {
  const editableDays = getEditableDaysSet(config)
  let defaultEntries = config.defaultEntries
  if (config.personalDefaultEntries.length) {
    defaultEntries = config.personalDefaultEntries
  }

  type TimeOffByDate = Record<string, TimeOff>
  const timeOffByDate = timeOffRequests.reduce<TimeOffByDate>((acc, x) => {
    const tempAcc: TimeOffByDate = {}
    for (const date in x.unitsPerDay) {
      tempAcc[date] = { unit: x.unit, value: x.unitsPerDay[date] }
    }
    return { ...acc, ...tempAcc }
  }, {})
  const publicHolidayByDate = publicHolidays.reduce(fp.by('date'), {})

  if (mode === 'day') {
    const formattedDate = date.format(DATE_FORMAT)
    if (
      !editableDays.has(formattedDate) ||
      timeOffByDate[formattedDate] ||
      publicHolidayByDate[formattedDate]
    ) {
      return []
    }
    return defaultEntries.map((de) => ({
      date: formattedDate,
      startTime: de[0],
      endTime: de[1],
    }))
  } else if (mode === 'week') {
    const startOfWeek = date.startOf('isoWeek')
    const week = Array(7)
      .fill(null)
      .map((_, i) => startOfWeek.add(i, 'day'))
    return week
      .filter((x) => config.workingDays.includes(x.day()))
      .filter((x) => {
        const dateFormatted = x.format(DATE_FORMAT)
        return (
          editableDays.has(dateFormatted) &&
          !timeOffByDate[dateFormatted] &&
          !publicHolidayByDate[dateFormatted]
        )
      })
      .map((day) => {
        return defaultEntries.map((de) => ({
          date: day.format(DATE_FORMAT),
          startTime: de[0],
          endTime: de[1],
        }))
      })
      .flat()
  }
  return []
}

export function formatTimeString(time: string): string {
  if (!SHOULD_USE_12H_CYCLE) {
    return time
  }
  const [hourString, minute] = time.split(':')
  const hour = +hourString % 24
  return (hour % 12 || 12) + ':' + minute + (hour < 12 ? 'AM' : 'PM')
}

export function getPeriodLabel(
  unit: 'week' | 'month' | 'day',
  offset: number
): string {
  switch (true) {
    case offset === 0:
      return `Current ${unit}`
    case offset === 1:
      return `Next ${unit}`
    case offset === -1:
      return `Previous ${unit}`
    case offset < -1:
      return `${-1 * offset} ${unit}s ago`
    case offset > 1:
      return `In ${offset} ${unit}s`
    default:
      return ''
  }
}

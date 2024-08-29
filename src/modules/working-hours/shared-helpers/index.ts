import dayjs, { Dayjs } from 'dayjs'
import dayjsIsoWeek from 'dayjs/plugin/isoWeek'
import {
  GenericWorkingHoursEntry,
  PublicHoliday,
  TimeOffRequest,
  TimeOffRequestUnit,
  WorkingHoursConfig,
  WorkingHoursEntry,
} from '#shared/types'
import * as fp from '#shared/utils'

dayjs.extend(dayjsIsoWeek)

// @todo implement #shared/constants and use `DATE_FORMAT`
const DATE_FORMAT = 'YYYY-MM-DD'

export function calculateTotalWorkingHours(
  entries: GenericWorkingHoursEntry[]
): [number, number] | null {
  if (!entries.length) return null
  const today = dayjs().startOf('day')
  const minutes = entries.reduce((acc, x) => {
    const [startH, startM] = x.startTime.split(':').map(Number)
    const [endH, endM] = x.endTime.split(':').map(Number)
    const startDate = today.clone().hour(startH).minute(startM)
    const endDate = today.clone().hour(endH).minute(endM)
    return acc + endDate.diff(startDate, 'minutes')
  }, 0)
  return [Math.floor(minutes / 60), minutes % 60]
}

export function getExactHours(time: [number, number] | null): number {
  if (!time) return 0
  return Number((time[0] + time[1] / 60).toFixed(1))
}

export function getDurationString(value: [number, number]): string {
  const hPart = value[0] ? `${value[0]}h` : ''
  const mPart = value[1] ? `${value[1]}m` : ''
  return `${hPart} ${mPart}`.trim()
}

export function getDifference(
  t1: [number, number],
  t2: [number, number]
): [number, number] {
  const t1Minutes = t1[0] * 60 + t1[1]
  const t2Minutes = t2[0] * 60 + t2[1]
  const diffMinutes = Math.abs(t1Minutes - t2Minutes)
  return [Math.floor(diffMinutes / 60), diffMinutes % 60]
}

export type OverworkLevel = 'red' | 'yellow' | 'gray' | null

export function calculateOverwork(
  workingTime: [number, number] | null,
  config: WorkingHoursConfig
): { time: [number, number] | null; level: OverworkLevel } {
  const hours = getExactHours(workingTime)
  if (hours <= config.weeklyWorkingHours) {
    return { time: null, level: null }
  }
  const overtimeWarning =
    config.weeklyWorkingHours + config.weeklyOvertimeHoursWarning
  const overtimeNotice =
    config.weeklyWorkingHours + config.weeklyOvertimeHoursNotice
  const level =
    hours >= overtimeWarning
      ? 'red'
      : hours >= overtimeNotice
      ? 'yellow'
      : hours >= config.weeklyWorkingHours
      ? 'gray'
      : null
  const time = workingTime
    ? getDifference(workingTime, [config.weeklyWorkingHours, 0])
    : null
  return { time, level }
}

export function sumTime(
  ...args: ([number, number] | null)[]
): [number, number] | null {
  return args.reduce((acc, x) => {
    const t1 = acc || [0, 0]
    const t2 = x || [0, 0]
    const [h1, m1] = t1 || [0, 0]
    const [h2, m2] = t2 || [0, 0]
    const hours = h1 + h2 + Math.floor((m1 + m2) / 60)
    const minutes = (m1 + m2) % 60
    if (!hours && !minutes) return null
    return [hours, minutes]
  }, null)
}

export function getEditablePeriod(
  config: WorkingHoursConfig | null
): [Dayjs, Dayjs] | null {
  if (!config) return null
  const now = dayjs()
  const period = config.editablePeriod
  const result: [Dayjs, Dayjs] = [now.startOf('month'), now.endOf('month')]
  const additionalWeeks = now.add(period.nextWeeks, 'week').endOf('isoWeek')
  if (additionalWeeks.isAfter(result[1])) {
    result[1] = additionalWeeks
  }
  if (now.date() < period.prevMonthBefore) {
    result[0] = result[0].subtract(1, 'month').startOf('month')
  }
  return result
}

export function getEditableDaysSet(
  config: WorkingHoursConfig | null
): Set<string> {
  if (!config) return new Set()
  const period = getEditablePeriod(config)
  if (!period) return new Set()
  const [start, end] = period
  const diff = end.diff(start, 'day') + 1
  return new Set(
    Array(diff)
      .fill(null)
      .map((x, i) => {
        return start.add(i, 'day').format(DATE_FORMAT)
      })
  )
}

export function calculateTotalTimeOffTime(
  interval: [Dayjs, Dayjs],
  requests: TimeOffRequest[],
  config: WorkingHoursConfig | null
): [number, number] | null {
  if (!config || !requests.length) {
    return null
  }
  const hoursPerDay = config.weeklyWorkingHours / config.workingDays.length
  const dates = new Set(getIntervalDates(interval[0], interval[1]))
  let days = 0
  let hours = 0
  for (const request of requests) {
    for (const date of request.dates) {
      if (dates.has(date)) {
        if (request.unit === TimeOffRequestUnit.Day) {
          days += request.unitsPerDay[date]
        } else if (request.unit === TimeOffRequestUnit.Hour) {
          hours += request.unitsPerDay[date]
        }
      }
    }
  }
  const resultHours = hours + days * hoursPerDay
  const resultMinutes = (resultHours % 1) * 60
  return !!resultHours
    ? [Math.floor(resultHours), Math.floor(resultMinutes)]
    : null
}

export function calculateTotalPublicHolidaysTime(
  holidays: PublicHoliday[],
  config: WorkingHoursConfig | null
): [number, number] | null {
  if (!config || !holidays.length) {
    return null
  }
  const dates = holidays.filter((x) => {
    const date = dayjs(x.date, DATE_FORMAT)
    return config.workingDays.includes(date.day())
  })
  const hoursPerDay = config.weeklyWorkingHours / config.workingDays.length
  const resultHours = dates.length * hoursPerDay
  const resultMinutes = (resultHours % 1) * 60
  return !!resultHours
    ? [Math.floor(resultHours), Math.floor(resultMinutes)]
    : null
}

export function calculateAverageWorkingTimeByDays(
  days: number,
  config: WorkingHoursConfig
): [number, number] | null {
  const hours = (days * config.weeklyWorkingHours) / config.workingDays.length
  const minutes = (hours % 1) * 60
  return !!hours ? [Math.floor(hours), Math.floor(minutes)] : null
}

export function getIntervalDates(from: Dayjs, to: Dayjs): string[] {
  return Array(to.diff(from, 'day') + 1)
    .fill(null)
    .map((x, i) => {
      return from.add(i, 'day').format(DATE_FORMAT)
    })
}

export function getIntervalWeeks(
  from: Dayjs,
  to: Dayjs
): Array<{ index: string; start: Dayjs; end: Dayjs }> {
  if (to <= from) return []
  const diff = to.diff(from, 'week') + 1
  return Array(diff)
    .fill(null)
    .map((x, i) => {
      const start = from.startOf('isoWeek').add(i, 'week')
      return {
        index: start.format(DATE_FORMAT),
        start,
        end: start.endOf('isoWeek'),
      }
    })
}

export type TimeOff = { unit: TimeOffRequestUnit; value: number }

export function getTimeOffByDate(
  requests: TimeOffRequest[]
): Record<string, TimeOff> {
  return requests.reduce<Record<string, TimeOff>>((acc, x) => {
    const tempAcc: Record<string, TimeOff> = {}
    for (const date in x.unitsPerDay) {
      tempAcc[date] = { unit: x.unit, value: x.unitsPerDay[date] }
    }
    return { ...acc, ...tempAcc }
  }, {})
}

export function getTimeOffNotation(timeOff: TimeOff): string {
  if (timeOff.unit === TimeOffRequestUnit.Hour) {
    return `${timeOff.value}h time off`
  }
  if (timeOff.value === 1) {
    return `Full day off`
  }
  if (timeOff.value === 0.5) {
    return `½ day off`
  }
  if (timeOff.value === 0.25) {
    return `¼ day off`
  }
  return `${timeOff.value} day off`
}

export function getDateRangeEdges(_dates: string[]): [string, string] | null {
  const dates = Array.from(new Set(_dates)).sort()
  if (!dates.length) return null
  return [dates[0], fp.last(dates)]
}

export function getWeekIndexesRange(dates: string[]): string[] {
  const range = getDateRangeEdges(dates)
  if (!range) return []
  const start = dayjs(range[0], DATE_FORMAT)
  const end = dayjs(fp.last(range), DATE_FORMAT)
  const diff = end.diff(start, 'week') + 1
  return Array(diff)
    .fill(null)
    .map((x, i) => {
      return end.startOf('isoWeek').subtract(i, 'week').format(DATE_FORMAT)
    })
}

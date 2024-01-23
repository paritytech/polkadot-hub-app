import { appConfig } from '#server/app-config'
import { DATE_FORMAT_DAY_NAME } from '#server/constants'
import { Office, RoomReservation } from '#shared/types'
import dayjs, { Dayjs } from 'dayjs'

export const intervalStep = 30

export const getIntervals = (
  startTime: dayjs.Dayjs,
  endTime: dayjs.Dayjs,
  interval = 30
): Array<string> => {
  const timeSlots = []
  let currentTime = dayjs(startTime)

  const firstIntervalEnd = roundToTheNearestHalfHour(currentTime)

  if (firstIntervalEnd.isBefore(endTime) || firstIntervalEnd.isSame(endTime)) {
    timeSlots.push(
      `${startTime.format('H:mm')} - ${firstIntervalEnd.format('H:mm')}`
    )
    currentTime = firstIntervalEnd
  }

  while (currentTime.isBefore(endTime)) {
    const rangeStart = currentTime.format('H:mm')
    const rangeEnd = currentTime.add(interval, 'minute').format('H:mm')
    const nextRangeEnd = currentTime.add(interval, 'minute')
    if (nextRangeEnd.isAfter(endTime)) {
      break
    }
    const timeRange = `${rangeStart} - ${rangeEnd}`
    timeSlots.push(timeRange)
    currentTime = currentTime.add(intervalStep, 'minute')
  }

  return timeSlots
}

/**
 *
 * @param durationIntervals [ '17:30 - 19:00', '19:00 - 19:30' ] - all the possible x minute intervals between a certain start and end time
 * @param timezone
 * @param occupiedTimeSlots [ '18:30 - 19:00', '19:00 - 19:30' ] - array of 30 minute occupied intervals
 * @returns Array<string> array of 30 minute intervals which are not occupied
 */
export const getAvailableRanges = (
  durationIntervals: Array<string>,
  timezone: string,
  occupiedTimeSlots: Array<string>
): Array<string> => {
  return durationIntervals.filter((range) => {
    const time: Array<string> = range.split(' - ')
    const startT: Array<string> = time[0].split(':')
    const endT: Array<string> = time[1].split(':')

    // get 30 minute intervals from the given duration interval, which can be 1 hrs++ long
    const allTheIntervalsForaGivenDuration = getIntervals(
      getDateTimeInTimezone(timezone, startT),
      getDateTimeInTimezone(timezone, endT)
    )
    return allTheIntervalsForaGivenDuration.every((interval) =>
      occupiedTimeSlots.every(
        (occupiedInterval) => !intervalsOverlap(occupiedInterval, interval)
      )
    )
  })
}

/**
 *
 * @param interval1 e.g.  20:00 - 20:30
 * @param interval2 e. g.  20:00 - 22:30
 * @returns
 */
function intervalsOverlap(interval1: string, interval2: string) {
  const currentDate = dayjs().format('YYYY-MM-DD')
  const [start1, end1] = interval1
    .split(' - ')
    .map((time) => dayjs(`${currentDate} ${time}`))
  const [start2, end2] = interval2
    .split(' - ')
    .map((time) => dayjs(`${currentDate} ${time}`))
  return start1.isBefore(end2) && end1.isAfter(start2)
}

export function isWeekend(date: string): boolean {
  const checkDate = dayjs(date)
  const dayOfWeek = checkDate.day()

  return dayOfWeek === 6 || dayOfWeek === 0 // Saturday: 6, Sunday: 0
}

export function compareTimes(time1: string[], time2: string[]): number {
  const [hour1, minute1] = time1.map(Number)
  const [hour2, minute2] = time2.map(Number)

  const time1Instance = dayjs()
    .hour(hour1)
    .minute(minute1)
    .second(0)
    .millisecond(0)
  const time2Instance = dayjs()
    .hour(hour2)
    .minute(minute2)
    .second(0)
    .millisecond(0)

  if (time1Instance.isBefore(time2Instance)) {
    return -1
  } else if (time1Instance.isAfter(time2Instance)) {
    return 1
  } else {
    return 0
  }
}

export const getDateTimeInTimezone = (
  tz: string,
  time: Array<string>,
  date?: string
): dayjs.Dayjs =>
  dayjs
    .tz(date, tz)
    .set('hour', Number(time[0]))
    .set('minute', Number(time[1]))
    .second(0)
    .millisecond(0)

export const timezoneDateToUTC = (
  date: string,
  time: string,
  tz: string
): dayjs.Dayjs => dayjs.tz(`${date} ${time}`, tz).utc()

export const getDateTime = (time: Array<string>): dayjs.Dayjs =>
  dayjs()
    .startOf('day')
    .set('hour', Number(time[0]))
    .set('minute', Number(time[1]))

export const isBeforeToday = (date: string): boolean =>
  dayjs(date).isBefore(dayjs().startOf('day'))

export const getStartAndEndOfDayInUTC = (
  date: string,
  timezoneName: string
): { startOfDayUTC: dayjs.Dayjs; endOfDayUTC: dayjs.Dayjs } => {
  const startOfDay = dayjs.tz(date, timezoneName).startOf('day')
  const endOfDay = dayjs.tz(date, timezoneName).endOf('day')
  return { startOfDayUTC: startOfDay.utc(), endOfDayUTC: endOfDay.utc() }
}

export const parseTimeSlot = (
  timeSlot: string
): { startT: Array<string>; endT: Array<string> } => {
  const time: Array<string> = timeSlot.split(' - ')
  const startT: Array<string> = time[0].split(':')
  const endT: Array<string> = time[1].split(':')
  return { startT, endT }
}

export const roundToTheNearestHalfHour = (datetime: Dayjs) => {
  // Round to the next half hour or hour
  const roundedTime = datetime
    .add(30 - (datetime.minute() % 30), 'minute')
    .startOf('minute')

  if (roundedTime.minute() !== 0) {
    roundedTime.add(60 - roundedTime.minute(), 'minute').startOf('minute')
  }

  return roundedTime
}

export const getTime = (date: string | Date, tz: string) => {
  return dayjs(date).tz(tz).format('LT')
}
export const getDate = (d: string | Date, tz: string) =>
  dayjs(d).tz(tz).format(DATE_FORMAT_DAY_NAME)

export const getDateTimeString = (reservation: RoomReservation, tz: string) =>
  `${getDate(reservation.startDate, tz)} , ${getTime(
    reservation.startDate,
    tz
  )} - ${getTime(reservation.endDate, tz)}`

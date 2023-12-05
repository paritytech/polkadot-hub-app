import dayjs from 'dayjs'
import dayjsDuration from 'dayjs/plugin/duration'
import isTomorrow from 'dayjs/plugin/isTomorrow'
import { DATE_FORMAT } from '#client/constants'
import { RoomDisplayData, RoomReservationStatus } from '#shared/types'

export const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000'
export const TEMP_MEETING_ID = 'temporary'

dayjs.extend(dayjsDuration)
dayjs.extend(isTomorrow)

export const formatTimeLeft = (
  timeLeft: number
): { term: string; value: string } => {
  const duration = dayjs.duration(timeLeft, 'seconds')
  const hours = duration.hours()
  const minutes = duration.minutes()
  const seconds = duration.seconds()

  if (hours === 0) {
    if (minutes === 0) {
      return {
        term: 'seconds',
        value: seconds.toString(),
      }
    } else {
      return {
        term: 'minutes',
        value: minutes.toString(),
      }
    }
  }

  if (hours > 0) {
    if (minutes > 0) {
      return {
        term: 'hours',
        value: dayjs(`${hours}:${minutes}`, 'HH:mm').format('H:mm'),
      }
    } else {
      return {
        term: 'hours',
        value: hours.toString(),
      }
    }
  }

  return {
    term: 'minutes',
    value: minutes.toString(),
  }
}

export function formatTime(date: Date, tz: string | undefined): string {
  return dayjs(date).tz(tz).format('HH:mm')
}

export function formatDayOfTheWeekWithDate(date: string): {
  day: string
  date: string
} {
  const theDate = dayjs(date)
  let formattedDate = theDate.isToday()
    ? 'Today'
    : theDate.isTomorrow()
    ? 'Tomorrow'
    : theDate.locale('en').format('dddd')

  return {
    day: formattedDate,
    date: theDate.format('DD MMMM'),
  }
}

export function getTimeLeft(d1: Date, d2: Date): number {
  // if start date is past current time,
  const datetime1 = dayjs(d1)
  const datetime2 = dayjs(d2)
  const now = dayjs()

  let diff
  // maybe have to add an extra minute
  if (datetime1.isBefore(now)) {
    diff = datetime2.diff(now, 'seconds')
  } else {
    diff = datetime2.diff(datetime1, 'seconds') + 60
  }
  if (diff < 0) {
    return 0
  }
  if (diff <= 60) {
    return diff
  } else return diff
}

export function getDifference(
  d1: Date,
  d2: Date,
  format: 'seconds' | 'minutes' = 'seconds'
): number {
  // if start date is past current time,
  const datetime1 = dayjs(d1)
  const datetime2 = dayjs(d2)
  return datetime2.diff(datetime1, format)
}

export function getTimeSlot(start: Date, end: Date, tz: string): string {
  return ` ${formatTime(start, tz)} - ${formatTime(end, tz)}`
}

export function getCurrentMeeting(
  office: string,
  roomId: string,
  startDate: Date,
  endDate: Date
) {
  return {
    id: TEMP_MEETING_ID,
    creatorUserId: TEMP_USER_ID,
    userIds: [TEMP_USER_ID],
    status: 'confirmed' as RoomReservationStatus,
    office,
    roomId,
    startDate,
    endDate,
    createdAt: dayjs().toDate(),
    updatedAt: dayjs().toDate(),
  }
}

export const getRoomObject = (
  display: RoomDisplayData,
  startDate: Date,
  endDate: Date
) => ({
  userIds: [TEMP_USER_ID],
  roomId: display.roomId ?? '',
  date: dayjs().format(DATE_FORMAT),
  timeSlot: getTimeSlot(startDate, endDate, display.timezone ?? ''),
})

export const roundToNearestHalfHour = (enteredEndDate: dayjs.Dayjs) =>
  enteredEndDate
    .minute(Math.round(enteredEndDate.minute() / 30) * 30)
    .second(0)
    .millisecond(0)

export const timeUntilNearestHalfHour = (timeStep: number) =>
  dayjs.duration(timeStep - (dayjs().minute() % timeStep), 'minutes')

export function isWithinWorkingHours(
  datetimeV: string,
  hours: Array<string> | null
): boolean {
  let checkTime
  if (!datetimeV) {
    checkTime = dayjs()
  } else {
    checkTime = dayjs(datetimeV)
  }
  if (!hours) {
    return false
  }
  const startTime = dayjs(hours[0], 'HH:mm')
  const endTime = dayjs(hours[1], 'HH:mm')
  return checkTime.isSameOrAfter(startTime) && checkTime.isBefore(endTime)
}

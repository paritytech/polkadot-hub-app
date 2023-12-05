import dayjs from 'dayjs'
import dayjsIsSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(dayjsIsSameOrBefore)

type PartialWorkingHoursEntry = {
  startTime: string
  endTime: string
  [key: string]: any
}

export const TIME_STRING_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

export function validateEntry(entry: PartialWorkingHoursEntry): string | null {
  const { startTime, endTime } = entry
  if (!TIME_STRING_REGEX.test(startTime)) {
    return 'Invalid start time.'
  }
  if (!TIME_STRING_REGEX.test(endTime)) {
    return 'Invalid end time.'
  }
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const today = dayjs().startOf('day')
  const startDate = today.clone().hour(startH).minute(startM)
  const endDate = today.clone().hour(endH).minute(endM)
  if (endDate.isSameOrBefore(startDate)) {
    return 'Invalid time interval. Please ensure the end time is after the start time.'
  }
  return null
}

export function validateDayEntries(entries: PartialWorkingHoursEntry[]): string | null {
  // check overlapping
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (isOverlap(entries[i], entries[j])) {
        return 'Some of the entries have an overlap.'
      }
    }
  }
  return null
}

function isOverlap(e1: PartialWorkingHoursEntry, e2: PartialWorkingHoursEntry): boolean {
  const format = 'HH:mm'
  const start1 = dayjs(e1.startTime, format)
  const end1 = dayjs(e1.endTime, format)
  const start2 = dayjs(e2.startTime, format)
  const end2 = dayjs(e2.endTime, format)
  return (
    (start1.isSameOrBefore(start2) && end1.isAfter(start2)) ||
    (start1.isBefore(end2) && end1.isSameOrAfter(end2)) ||
    (start2.isSameOrBefore(start1) && end2.isAfter(end1)) ||
    (start2.isBefore(end1) && end2.isSameOrAfter(end1))
  )
}

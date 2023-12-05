import dayjs from 'dayjs'

export function isWithinWorkingHours(
  timeSlot: string,
  hours: Array<string>
): boolean {
  const startTime = dayjs(hours[0], 'HH:mm')
  const endTime = dayjs(hours[1], 'HH:mm')
  const checkTime = dayjs(timeSlot, 'HH:mm')
  return checkTime.isSameOrAfter(startTime) && checkTime.isBefore(endTime)
}

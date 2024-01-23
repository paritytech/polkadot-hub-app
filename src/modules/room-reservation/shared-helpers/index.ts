import { Office, OfficeArea, OfficeRoom } from '#shared/types'
import dayjs from 'dayjs'
import { boolean } from 'zod'

export function isWithinWorkingHours(
  timeSlot: string,
  hours: Array<string>
): boolean {
  const startTime = dayjs(hours[0], 'HH:mm')
  const endTime = dayjs(hours[1], 'HH:mm')
  const checkTime = dayjs(timeSlot, 'HH:mm')
  return checkTime.isSameOrAfter(startTime) && checkTime.isBefore(endTime)
}

export const getRooms = (office: Office) =>
  office?.areas?.flatMap((area) => area.meetingRooms).filter((a) => !!a) || []

export const getRoom = (
  office: Office,
  roomId: string
): OfficeRoom | undefined =>
  getRooms(office).find((room) => room?.id === roomId)

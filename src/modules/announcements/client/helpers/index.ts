import { DATE_FORMAT_DAY_NAME } from '#client/constants'
import dayjs from 'dayjs'

export const getDayDifference = (date: string) => {
  const now = dayjs().startOf('day')
  const givenDate = dayjs(date).startOf('day')
  const numberOfDays = givenDate.diff(now, 'day')
  if (numberOfDays === 0) {
    return 'today'
  }
  if (numberOfDays < -21) {
    return 'a while ago'
  }
  return numberOfDays < 0
    ? `${Math.abs(numberOfDays)} days ago`
    : `in ${numberOfDays} days`
}

export const formatDate = (date: string) => {
  const d = dayjs(date).format(DATE_FORMAT_DAY_NAME)
  const diff = getDayDifference(date)
  return `${d} (${diff})`
}

export const isDateInPast = (date: string) =>
  dayjs(date).isBefore(dayjs(), 'day')

export const isCurrentlyHappening = (start: string, end: string) =>
  dayjs().isAfter(dayjs(start)) && dayjs().isBefore(dayjs(end))

export enum AnnouncementNotifications {
  CreatedSuccess = 'The announcement has been created successfully',
  UpdatedSuccess = 'The announcement has been updated successfully',
}

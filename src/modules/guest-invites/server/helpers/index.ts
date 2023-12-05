import { DATE_FORMAT } from '#server/constants'
import dayjs from 'dayjs'

export const formatVisitDates = (dates: string[], format: string = 'D MMM') =>
  dates.map((x: string) => ({
    date: dayjs(x, DATE_FORMAT).format(format),
  }))

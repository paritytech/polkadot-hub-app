import dayjs from 'dayjs'
import dayjsTimezone from 'dayjs/plugin/timezone'
import dayjsUtc from 'dayjs/plugin/utc'

dayjs.extend(dayjsTimezone)
dayjs.extend(dayjsUtc)

export const parseGmtOffset = (timezone: string): string => {
  if (!timezone) {
    return ''
  }
  const gmtOffset: string = dayjs().tz(timezone).format('Z')

  // @todo Do we care about countries with 30 minute difference in timezones?
  // https://www.worldtimeserver.com/learn/unusual-time-zones/
  // we only want to use the hour part of the offset
  const offsetNumber: number = parseInt(gmtOffset.substring(0, 3))
  const sign = offsetNumber > 0 ? '+' : ''

  if (offsetNumber === 0) {
    return 'GMT'
  }

  return 'GMT'.concat(`${sign}`).concat(offsetNumber.toString())
}

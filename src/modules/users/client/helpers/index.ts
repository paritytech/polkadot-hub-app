import dayjs, { Dayjs } from 'dayjs'
import dayjsTimezone from 'dayjs/plugin/timezone'
import dayjsUtc from 'dayjs/plugin/utc'

dayjs.extend(dayjsUtc)
dayjs.extend(dayjsTimezone)

const getOffset = (t: string): number => parseInt(dayjs().tz(t).format('Z'))
const getDateForTimezone = (t: string): Dayjs => dayjs.utc().tz(t)
export const formatBirthday = (bday: string) =>
  bday ? dayjs(bday).format('D MMMM YYYY') : null
const TIME_FORMAT = 'HH:mm'

/**
 * Returns
 * - timezone difference in hours between two timezones and direction of the difference.
 * - their day in relation to yours - Yesterday, Today, Tomorrow
 *
 * @param them: string, 'Pacific/Auckland'
 * @param myTimezone: string, 'America/Los_Angeles'
 * @returns: string, Yesterday, 16h behind
 */
export const getTzDifference = (
  them: string | undefined,
  myTimezone?: string
): string => {
  if (!them) {
    return ''
  }
  if (!myTimezone) {
    myTimezone = dayjs.tz.guess()
  }

  const diff = getOffset(them) - getOffset(myTimezone)

  const theirDate = getDateForTimezone(them)
  const theirTime = theirDate.format(TIME_FORMAT)

  return `${theirTime} ${
    diff !== 0 ? '('.concat(diff > 0 ? '+' : '', String(diff), 'h)') : ''
  }`
}

export const reverseGeocoding = async (
  longitude: number,
  latitude: number
): Promise<{
  city: string
  country: string
  countryCode: string
}> => {
  const geocodingAPI = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place&timezone=true&language=en&access_token=${process.env.MAPBOX_API_KEY}`
  const data: Response = await fetch(geocodingAPI)

  const features: GeoJSON.GeoJsonProperties = await data.json()
  const featureData = features?.features
  let city, country, countryCode

  // Iterate through the features to find the city and country
  for (let i = 0; i < featureData.length; i++) {
    const feature = featureData[i]
    if (feature?.place_type.includes('place')) {
      city = feature.text
      for (const contextItem of feature.context) {
        if (contextItem.id.includes('country') && contextItem.short_code) {
          country = contextItem.text
          countryCode = contextItem.short_code
          break
        }
      }
      break
    }
  }

  return {
    city,
    country,
    countryCode: countryCode.toUpperCase(),
  }
}

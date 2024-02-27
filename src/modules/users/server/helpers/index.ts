import { FastifyInstance } from 'fastify'
import { Office } from '#server/app-config/types'
import { COUNTRY_COORDINATES } from '#server/constants'
import { GeoData } from '../../types'
import { parseGmtOffset } from '../../shared-helpers'
import { sequelize } from '#server/db'
import { AuthAddressPair } from '#shared/types'
import { User } from '../models'

export const getDefaultLocation = (
  city: string | null,
  country: string | null,
  defaultOffice: string,
  offices: Office[]
): string => {
  let office
  if (city) {
    office = offices.find((o) => o.city === city)?.id || null
  } else if (!!country) {
    office = offices.find((o) => o.country === country)?.id || null
  }
  return office ?? defaultOffice
}

export const getGeoDataInfo = async (
  fastify: FastifyInstance,
  city: string | null,
  country: string | null,
  doNotShareLocation: boolean
): Promise<GeoData> => {
  if (!city && !country) {
    return { doNotShareLocation }
  }

  if (city && country) {
    const result = await fastify.db.City.findOne({
      attributes: ['id', 'name', 'coordinates', 'timezone'],
      where: { name: city, countryCode: country },
    })
    return {
      timezone: result?.timezone,
      coordinates: result?.coordinates.length && [
        result?.coordinates[1],
        result?.coordinates[0],
      ],
      gmtOffset: result?.timezone
        ? parseGmtOffset(result?.timezone)
        : undefined,
      doNotShareLocation,
    }
  }
  if (country) {
    return {
      coordinates: COUNTRY_COORDINATES[country],
      doNotShareLocation,
    }
  }
  return {
    doNotShareLocation,
  }
}

export const getUserProvider = async (provider: string, address: string) => {
  const users = await sequelize.query(
    `
    SELECT * FROM "users" AS "User"
    WHERE "User"."authIds" != '{}' AND
    EXISTS (
      SELECT 1
      FROM jsonb_each("User"."authIds" -> :provider) AS extensions
      WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements(extensions.value) AS elem
        WHERE elem ->> 'address' = :address
      )
    )
  `,
    {
      model: User,
      mapToModel: true, // Maps the results to the model, so instances of User are returned
      replacements: { provider, address },
    }
  )
  return users
}

export const removeAuthId = (
  authIds: Record<string, AuthAddressPair[]>,
  addressToRemove: string
) => {
  return Object.fromEntries(
    Object.entries(authIds)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          const filteredArray = value.filter(
            (item) => item.address !== addressToRemove
          )
          return [key, filteredArray.length > 0 ? filteredArray : undefined]
        } else {
          return [key, value]
        }
      })
      .filter(([_, value]) => value !== undefined)
  )
}

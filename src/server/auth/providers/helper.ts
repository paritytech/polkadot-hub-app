import { FastifyInstance } from 'fastify'
import { u8aToHex } from '@polkadot/util'
import { decodeAddress, signatureVerify } from '@polkadot/util-crypto'
import { Op } from 'sequelize'
import dayjs from 'dayjs'
import { jwt } from '#server/utils'
import { sequelize } from '#server/db'
import config from '#server/config'
import { Session } from '#modules/users/server/models'

export const getSession = async (
  userId: string,
  fastify: FastifyInstance
): Promise<Session> => {
  const now = dayjs()
  const expiresAt = now.add(config.jwtExpiresInDays, 'day').endOf('day')
  const expiresIn = expiresAt.diff(now, 'second')
  const signRequest = await jwt.sign({ id: userId }, expiresIn)
  if (!signRequest.success) {
    throw new Error(signRequest.error.message)
  }
  return await fastify.db.Session.create({
    token: signRequest.data,
    userId: userId,
  })
}

export const getUserProviderQuery = (
  provider: string,
  extension: string,
  address: string
) => {
  const providerEsc = sequelize.escape(provider)
  const extensionEsc = sequelize.escape(extension)
  const addressEsc = sequelize.escape(address)
  return {
    authIds: {
      [Op.and]: [
        { [Op.not]: '{}' }, // Filter fields that are not an empty object
        sequelize.literal(`jsonb_exists("User"."authIds", ${providerEsc})`),
        sequelize.literal(`exists(
            select 1 from jsonb_array_elements("User"."authIds"->${providerEsc}->${extensionEsc}) as elem
            where elem->>'address' = ${addressEsc}
          )`),
      ],
    },
  }
}

export const isValidSignature = (address: string, signature: string) => {
  try {
    const publicKey = decodeAddress(address)
    const hexPublicKey = u8aToHex(publicKey)
    if (!config.authMessageToSign) {
      console.log(
        'Make sure the Shared Message is set in the .env file, set value for AUTH_MESSAGE_TO_SIGN'
      )
      return false
    }
    return signatureVerify(config.authMessageToSign, signature, hexPublicKey)
      .isValid
  } catch (e: any) {
    console.log(e.message)
    return false
  }
}

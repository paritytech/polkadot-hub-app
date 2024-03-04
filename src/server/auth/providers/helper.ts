import { FastifyInstance } from 'fastify'
import { u8aToHex } from '@polkadot/util'
import { decodeAddress, signatureVerify } from '@polkadot/util-crypto'
import { Op } from 'sequelize'
import { jwt } from '#server/utils'
import config from '#server/config'
import { Session, User } from '#modules/users/server/models'
import { sequelize } from '#server/db'

export const getSession = async (
  userId: string,
  fastify: FastifyInstance
): Promise<Session> => {
  const jwtToken = await jwt.sign({ id: userId })
  return await fastify.db.Session.create({
    token: jwtToken,
    userId: userId,
  })
}

export const getUserProvider = async (provider: string, address: string) =>
  sequelize.query(
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

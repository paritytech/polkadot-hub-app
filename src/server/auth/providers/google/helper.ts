import { User } from '#modules/users/server/models'
import { FastifyInstance } from 'fastify'
import { getUserByProvider, isValidSignature } from '../helper'
import { GoogleParsedStateQueryParam } from '#server/types'
import { AuthProvider } from '#shared/types'

export const getStateParamsFromQuery = (query: Record<string, string>) => {
  const allowedParams: Array<keyof GoogleParsedStateQueryParam> = [
    'callbackPath',
    'account',
    'signature',
  ]
  let params: GoogleParsedStateQueryParam = {
    callbackPath: '',
    account: '',
    signature: '',
  }
  Object.keys(query).forEach((key: string) => {
    const k = key as keyof GoogleParsedStateQueryParam
    if (allowedParams.includes(k)) {
      params[k] = query[key]
    }
  })
  return params
}

/**
 *
 * There is an existing user in the database and you add polkadot address to that account
 * @param parsedState
 * @param user
 * @param fastify
 */
export const linkPolkadotAccountToExistingUser = async (
  parsedState: GoogleParsedStateQueryParam,
  user: User,
  fastify: FastifyInstance
) => {
  try {
    if (parsedState) {
      const account = parsedState.account
        ? JSON.parse(parsedState.account)
        : null
      if (account) {
        const isSignatureValid = isValidSignature(
          account.address,
          parsedState.signature ?? ''
        )
        if (!isSignatureValid) {
          throw new Error(
            `The signature is invalid. Cannot link to polkadot user.`
          )
        }
        const users = await getUserByProvider(
          AuthProvider.Polkadot,
          account.address
        )
        if (!!users.length) {
          throw new Error(
            'There is already a user with this address linked. Cannot connect the same address to two users.'
          )
        }

        await user
          .addAuthId(AuthProvider.Polkadot, account.source, {
            name: account.name,
            address: account.address,
          })
          .save()
      }
    }
  } catch (err: any) {
    fastify.log.error(err)
    fastify.log.error(err.message)
  }
}

import { appConfig } from '#server/app-config'
import { AuthAddressPair, AuthIds, AuthProvider } from '#shared/types'
import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from 'fastify'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import { getSession, getUserByProvider, isValidSignature } from '../helper'

export const plugin: FastifyPluginCallback = async (
  fastify: FastifyInstance
) => {
  fastify.post(
    '/users',
    async (
      req: FastifyRequest<{
        Body: { selectedAccount: InjectedAccountWithMeta; signature: string }
      }>,
      reply
    ) => {
      const body: InjectedAccountWithMeta = req.body.selectedAccount
      const isSignatureValid = isValidSignature(
        body.address,
        req.body.signature
      )
      if (!isSignatureValid) {
        return reply.throw.accessDenied()
      }
      const user = await getUserByProvider(AuthProvider.Polkadot, body.address)
      if (!!user.length) {
        return { userRegistered: true }
      }
      return { userRegistered: false }
    }
  )
  fastify.post(
    '/login',
    async (
      req: FastifyRequest<{
        Body: { selectedAccount: InjectedAccountWithMeta; signature: string }
      }>,
      reply
    ) => {
      const body: InjectedAccountWithMeta = req.body.selectedAccount
      const isSignatureValid = isValidSignature(
        body.address,
        req.body.signature
      )
      if (!isSignatureValid) {
        return reply.throw.accessDenied()
      }

      const user = await getUserByProvider(AuthProvider.Polkadot, body.address)

      if (!user.length) {
        return reply.throw.notFound('There is no account with this address')
      }
      // set cookies and login
      const session = await getSession(user[0].id, fastify)
      return reply.setSessionCookie(session.token).ok()
    }
  )

  fastify.post(
    '/register',
    async (
      req: FastifyRequest<{
        Body: { selectedAccount: InjectedAccountWithMeta; signature: string }
      }>,
      reply
    ) => {
      const body: InjectedAccountWithMeta = req.body.selectedAccount
      const source = body.source?.replaceAll(' ', '').toLowerCase()
      // @todo move to app config?
      const allowedExtensions = [
        'polkadot-js',
        'talisman',
        'subwallet-js',
        'subwallet',
        'novawallet',
        'walletconnect',
      ]

      if (!allowedExtensions.includes(source)) {
        return reply.throw.conflict('Unsupported extension')
      }

      const isSignatureValid = isValidSignature(
        body.address,
        req.body.signature
      )
      if (!isSignatureValid) {
        return reply.throw.accessDenied()
      }

      const user = await getUserByProvider(AuthProvider.Polkadot, body.address)
      if (!!user.length) {
        return reply.throw.conflict('User is already registered')
      }

      const authIds: Record<string, any> = {
        [AuthProvider.Polkadot]: {
          [source]: [
            {
              name: body.name ?? '',
              address: body.address ?? '',
            } as AuthAddressPair,
          ],
        },
      }
      const newUser = await fastify.db.User.create({
        authIds: authIds as AuthIds,
        fullName: '',
        roles: [appConfig.lowPriorityRole],
        isInitialised: false,
        email: '',
      })

      // set cookies and login
      const session = await getSession(newUser.id, fastify)
      return reply.setSessionCookie(session.token).ok()
    }
  )
}

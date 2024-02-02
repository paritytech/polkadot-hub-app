import { appConfig } from '#server/app-config'
import { AuthAddressPair, AuthIds, AuthProvider } from '#shared/types'
import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from 'fastify'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import { getSession, getUserProviderQuery, isValidSignature } from '../helper'

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
      const user = await fastify.db.User.findOneActive({
        where: getUserProviderQuery(
          AuthProvider.Polkadot,
          body.meta.source,
          body.address
        ),
      })
      if (user) {
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

      const user = await fastify.db.User.findOneActive({
        where: getUserProviderQuery(
          AuthProvider.Polkadot,
          body.meta.source,
          body.address
        ),
      })
      if (!user) {
        return reply.throw.notFound('There is no account with this address')
      }
      // set cookies and login
      const session = await getSession(user.id, fastify)
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

      // @todo move to app config?
      const allowedExtensions = ['polkadot-js', 'talisman']
      const extensionName = body.meta.source
      if (!allowedExtensions.includes(extensionName)) {
        return reply.throw.conflict('Unsupported extension')
      }

      const isSignatureValid = isValidSignature(
        body.address,
        req.body.signature
      )
      if (!isSignatureValid) {
        return reply.throw.accessDenied()
      }

      const user = await fastify.db.User.findOneActive({
        where: getUserProviderQuery(
          AuthProvider.Polkadot,
          body.meta.source,
          body.address
        ),
      })
      if (user) {
        return reply.throw.conflict('User is already registered')
      }

      const authIds: Record<string, any> = {
        [AuthProvider.Polkadot]: {
          [extensionName]: [
            {
              name: body.meta.name ?? '',
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

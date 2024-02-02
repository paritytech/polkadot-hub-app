import axios from 'axios'
import { FastifyPluginCallback, FastifyInstance, FastifyRequest } from 'fastify'
import fastifyOauthPlugin from '@fastify/oauth2'
import config from '#server/config'
import { appConfig } from '#server/app-config'
import {
  getStateParamsFromQuery,
  linkPolkadotAccountToExistingUser,
} from './helper'
import { GoogleParsedStateQueryParam } from '#server/types'
import { getSession } from '../helper'

export const plugin: FastifyPluginCallback = async (
  fastify: FastifyInstance
) => {
  fastify.register(fastifyOauthPlugin, {
    name: 'googleOAuth2',
    scope: ['profile email'],
    credentials: {
      client: {
        id: config.oauth2GoogleClientId,
        secret: config.oauth2GoogleClientSecret,
      },
      auth: fastifyOauthPlugin.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/login',
    callbackUri: `${config.appHost}/auth/google/callback`,
    generateStateFunction: (
      req: FastifyRequest<{
        Querystring: { callbackPath?: string; account?: string }
      }>
    ) => {
      let params: GoogleParsedStateQueryParam = getStateParamsFromQuery(
        req.query
      )
      if (!!params) {
        const state = JSON.stringify(params)
        return state
      }
      return null
    },
    checkStateFunction: (state: string, cb: (err?: Error) => void) => cb(),
  })

  fastify.get(
    '/callback',
    async (req: FastifyRequest<{ Querystring: { state?: string } }>, reply) => {
      if (!fastify.googleOAuth2) {
        return reply.code(500).send('Misconfigured')
      }

      const oauthToken =
        await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req)
      const data = await axios
        .get(`https://www.googleapis.com/oauth2/v2/userinfo`, {
          headers: { Authorization: 'Bearer ' + oauthToken.token.access_token },
        })
        .then((x) => x.data)

      let user = await fastify.db.User.findOne({ where: { email: data.email } })
      if (user?.deletedAt) {
        return reply.redirect('/')
      }
      if (!!data.picture) {
        // should be used only for userpic provided from Google Account!
        // -c parameter means the image was cropped
        // e.g will match =s96-c =s128
        data.picture = data.picture.replace(/=s\d+(-c)?$/, `=s${312}$1`)
      }
      if (!user) {
        user = await fastify.db.User.create({
          fullName: data.name,
          email: data.email,
          avatar: data.picture,
          roles: [appConfig.getDefaultUserRoleByEmail(data.email)],
        })
      } else {
        await user.set({ avatar: data.picture }).save()
      }

      // add type to show which parameters are allowed
      let parsedState: GoogleParsedStateQueryParam | null = null
      let callbackPath: string | null = null

      try {
        const state = req.query.state || null
        if (state) {
          parsedState = JSON.parse(state)
          if (parsedState) {
            callbackPath = parsedState.callbackPath
            if (parsedState && parsedState.account) {
              await linkPolkadotAccountToExistingUser(
                parsedState,
                user,
                fastify
              )
            }
          }
        }
      } catch (e: any) {
        fastify.log.error(e.message)
        fastify.log.error('Failed to parse google oauth state', req.query.state)
        return reply.throw.internalError('Unable to process the request')
      }

      const session = await getSession(user.id, fastify)
      return reply.setSessionCookie(session.token).redirect(callbackPath || '/')
    }
  )
}

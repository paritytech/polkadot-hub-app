import path from 'path'
import { FastifyPluginCallback } from 'fastify'
import { SESSION_TOKEN_COOKIE_NAME } from '#server/constants'
import { appConfig } from '#server/app-config'
import { safeRequire, getFilePath } from '#server/utils'

export const authPlugin = (): FastifyPluginCallback => {
  return async (fastify, opts) => {
    // decorate "db"
    const coreModels =
      safeRequire(
        getFilePath('dist_server/src/modules/users/server/models')
      ) || {}
    fastify.decorate('db', coreModels)

    // register each auth provider
    const providers = appConfig.config.application.auth.providers
    for (const provider of providers) {
      const { plugin } =
        safeRequire(
          getFilePath(`dist_server/src/server/auth/providers/${provider}`)
        ) || {}
      if (plugin) {
        fastify.register(plugin, { prefix: `/${provider}` })
      }
    }

    fastify.get('/logout', async (req, reply) => {
      return reply.clearCookie(SESSION_TOKEN_COOKIE_NAME).redirect('/')
    })
  }
}

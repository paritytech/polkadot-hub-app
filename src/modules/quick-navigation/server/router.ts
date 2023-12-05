import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { appConfig } from '#server/app-config'
import { Permissions } from '../permissions'
import { Metadata } from '../metadata-schema'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get('/links', async (req: FastifyRequest, reply) => {
    req.check(Permissions.Use)
    const metadata = appConfig.getModuleMetadata('quick-navigation') as Metadata
    return metadata.navigation
  })
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}

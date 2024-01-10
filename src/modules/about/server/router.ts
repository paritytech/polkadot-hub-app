import { appConfig } from '#server/app-config'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'

const mId = 'about'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/offices',
    async (
      req: FastifyRequest<{
        Params: { officeId: string }
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Missing office ID')
      }
      const addressDetail = appConfig.templates.text(mId, 'aboutOffice', {
        officeId: req.office,
      })
      const facilities = appConfig.templates.text(mId, 'facilities', {
        officeId: req.office,
      })
      return {
        addressDetail,
        facilities,
      }
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}

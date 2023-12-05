import { FastifyPluginCallback } from 'fastify'

const webhookRouter: FastifyPluginCallback = async (fastify, opts) => {
  fastify.post('/data', (request, reply) => {
    return reply.ok()
  })
}

module.exports = {
  webhookRouter
}

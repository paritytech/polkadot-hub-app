import { FastifyPluginCallback, FastifyRequest } from 'fastify'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}

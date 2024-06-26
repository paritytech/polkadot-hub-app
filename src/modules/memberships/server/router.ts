import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { MembershipCreationRequest } from '../types'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/memberships',
    async (
      req: FastifyRequest<{
        Querystring: { sortBy?: string }
      }>,
      reply
    ) => {
      // if (!req.office) {
      //   return reply.throw.badParams('Invalid office ID')
      // }
      const memberships = await fastify.db.Membership.findAll()
      return memberships
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/memberships/:memebershipId',
    async (
      req: FastifyRequest<{ Params: { memebershipId: string }; Reply: Event }>,
      reply
    ) => {
      // req.check(Permissions.AdminList)
      const membership = await fastify.db.Membership.findByPk(
        req.params.memebershipId
      )
      if (!membership) {
        return reply.throw.notFound()
      }
      return membership
    }
  )

  fastify.get(
    '/memberships',
    async (
      req: FastifyRequest<{
        Querystring: { sortBy?: string }
      }>,
      reply
    ) => {
      if (!req.office) {
        return reply.throw.badParams('Invalid office ID')
      }
      const memberships = await fastify.db.Membership.findAll()
      return memberships
    }
  )

  fastify.post(
    '/memberships',
    async (req: FastifyRequest<{ Body: MembershipCreationRequest }>, reply) => {
      // req.check(Permissions.AdminManage)

      const membership = await fastify.db.Membership.create({
        creatorUserId: req.user.id,
        editedByUserId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        currency: req.body.currency,
        durationInDays: req.body.durationInDays,
        nftCollectionId: req.body.nftCollectionId,
        image: req.body.image,
      })
      return reply.ok()
    }
  )
}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}

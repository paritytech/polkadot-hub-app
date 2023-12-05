import dayjs from 'dayjs'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Op } from 'sequelize'
import {
  AnnouncementItem,
  AnnouncementItemRequest,
  EntityVisibility,
} from '#shared/types'
import { Permissions } from '../permissions'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get('/active', async (req, reply) => {
    try {
      req.check(Permissions.Use)
    } catch (e) {
      return reply.ok()
    }
    if (!req.office) {
      return reply.throw.badParams('Invalid office ID')
    }

    const today = dayjs().tz(req.office.timezone).utc().startOf('day')
    return fastify.db.Announcement.findAll({
      attributes: ['title', 'content', 'id'],
      order: [['scheduledAt', 'ASC']],
      where: {
        visibility: EntityVisibility.Visible,
        allowedRoles: { [Op.contains]: [req.user.role] },
        offices: { [Op.contains]: [req.office.id] },
        scheduledAt: { [Op.lte]: today.toDate() },
        expiresAt: { [Op.gt]: today.toDate() },
      },
    })
  })
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get('/', async (req, reply) => {
    return fastify.db.Announcement.findAll({
      order: [['scheduledAt', 'DESC']],
    })
  })

  fastify.get(
    '/:announcementId',
    async (
      req: FastifyRequest<{
        Params: { announcementId: string }
        Reply: AnnouncementItem
      }>,
      reply
    ) => {
      const announcement = await fastify.db.Announcement.findByPk(
        req.params.announcementId
      )
      if (!announcement) {
        return reply.throw.notFound()
      }
      return announcement
    }
  )

  fastify.post(
    '/announcements',
    async (req: FastifyRequest<{ Body: AnnouncementItemRequest }>, reply) => {
      const announcement = req.body as AnnouncementItem

      await fastify.db.Announcement.create({
        ...announcement,
        expiresAt: announcement.expiresAt
          ? dayjs(announcement.expiresAt).utc().startOf('day').toDate()
          : null,
        scheduledAt: announcement.scheduledAt
          ? dayjs(announcement.scheduledAt).utc().startOf('day').toDate()
          : null,
        creatorUserId: req.user?.id,
      })
      return reply.ok()
    }
  )

  fastify.put(
    '/announcements/:announcementId',
    async (
      req: FastifyRequest<{
        Body: AnnouncementItemRequest
        Params: { announcementId: string }
      }>,
      reply
    ) => {
      const announcement = req.body as AnnouncementItem
      const existing = await fastify.db.Announcement.findByPk(
        req.params.announcementId
      )
      if (!existing) {
        return reply.throw.notFound()
      }

      await fastify.db.Announcement.update(
        {
          content: announcement.content,
          title: announcement.title,
          offices: announcement.offices,
          allowedRoles: announcement.allowedRoles,
          visibility: announcement.visibility,
          scheduledAt: announcement.scheduledAt
            ? dayjs(announcement.scheduledAt).startOf('day').toDate()
            : null,
          expiresAt: announcement.expiresAt
            ? dayjs(announcement.expiresAt).startOf('day').toDate()
            : null,
        },
        { where: { id: existing.id } }
      )
      return reply.ok()
    }
  )
}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}

import dayjs from 'dayjs'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Filterable, Op } from 'sequelize'
import { EntityVisibility } from '#shared/types'
import { Permissions } from '../permissions'
import { NewsItem, NewsRequest, NewsResponse } from '../types'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get('/news', async (req, reply) => {
    if (!req.office) {
      return reply.throw.badParams('Invalid office ID')
    }
    return fastify.db.News.findAll({
      order: [['publishedAt', 'DESC']],
      where: {
        visibility: EntityVisibility.Visible,
        allowedRoles: { [Op.overlap]: req.user.roles },
        offices: { [Op.contains]: [req.office.id] },
        published: true,
      },
    })
  })

  fastify.get(
    '/news/:newsId',
    async (
      req: FastifyRequest<{
        Params: { newsId: string }
        Reply: any
      }>,
      reply
    ) => {
      const where: Filterable<NewsItem>['where'] = {
        id: req.params.newsId,
      }
      if (!req.can(Permissions.AdminManage)) {
        where.visibility = {
          [Op.in]: [EntityVisibility.Visible, EntityVisibility.Url],
        }
        where.allowedRoles = { [Op.overlap]: req.user.roles }
        where.published = true
      }
      const newsArticle = await fastify.db.News.findOne({ where })
      if (!newsArticle) {
        return reply.throw.notFound()
      }
      return newsArticle
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get('/news', async (req, reply) => {
    req.check(Permissions.AdminList)
    return fastify.db.News.findAll({
      order: [['createdAt', 'DESC']],
    })
  })

  fastify.get(
    '/news/:newsId',
    async (
      req: FastifyRequest<{
        Params: { newsId: string }
        Reply: NewsResponse
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const newsArticle = await fastify.db.News.findByPk(req.params.newsId)
      if (!newsArticle) {
        return reply.throw.notFound()
      }
      return newsArticle
    }
  )

  fastify.post(
    '/news',
    async (req: FastifyRequest<{ Body: NewsRequest }>, reply) => {
      req.check(Permissions.AdminManage)
      const article = req.body as NewsItem
      if (article.published && !article.publishedAt) {
        article.publishedAt = dayjs().toDate()
      }
      if (!article.published) {
        article.publishedAt = null
      }
      await fastify.db.News.create({
        ...article,
        creatorUserId: req.user?.id,
      })
      return reply.ok()
    }
  )

  fastify.put(
    '/news/:newsId',
    async (
      req: FastifyRequest<{
        Body: NewsRequest
        Params: { newsId: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminManage)
      const article = req.body
      const existing = await fastify.db.News.findByPk(req.params.newsId)
      if (!existing) {
        return reply.throw.notFound()
      }
      if (article.published && !article.publishedAt) {
        article.publishedAt = dayjs().toDate()
      }
      if (!article.published) {
        article.publishedAt = null
      }

      await fastify.db.News.update(
        {
          content: article.content,
          title: article.title,
          offices: article.offices,
          allowedRoles: article.allowedRoles,
          visibility: article.visibility,
          published: article.published,
          publishedAt: article.publishedAt,
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

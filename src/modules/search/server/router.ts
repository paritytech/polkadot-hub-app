import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Op, Filterable } from 'sequelize'
import config from '#server/config'
import { cloneRegExp } from '#server/utils'
import { appConfig } from '#server/app-config'
import { User } from '#modules/users/types'
import { SearchSuggestion, SearchSuggestionEntity } from '../types'
import { TAG_ELEMENTS_REGEXP } from '../shared-helpers'
import { Permissions } from '../permissions'

const EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,255}$/

const SEARCHABLE_ROLES = appConfig.getRolesByPermission(Permissions.Use)

const userToSearchSuggestion = (x: any): SearchSuggestion => {
  let subtitle = ''
  if (x.jobTitle) {
    subtitle = x.jobTitle
  }
  const result: SearchSuggestion = {
    id: x.id,
    entity: SearchSuggestionEntity.User,
    title: x.fullName,
    subtitle: subtitle || null,
    image: x.avatar,
    url: `${config.appHost}/profile/${x.id}`,
  }
  return result
}
const tagToSearchSuggestion = (x: any): SearchSuggestion => ({
  id: x.id,
  entity: SearchSuggestionEntity.Tag,
  title: x.name,
  subtitle: null,
  image: null,
  url: '', // TODO: allow null
})

const extractTagNames = (query: string): string[] => {
  // clone a regex in order to keep `lastIndex` property isolated per request
  const tagsRegex = cloneRegExp(TAG_ELEMENTS_REGEXP, 'g')
  let match
  let tagNames = []
  while ((match = tagsRegex.exec(query))) {
    tagNames.push(match[1])
  }
  return tagNames
}

const getWhereClauseForUserSearch = (
  query: string
): Filterable<User>['where'] => {
  const wrappedQuery = `%${query}%`
  return {
    // TODO: full text search (+ ignore email/matrix domain)
    isInitialised: true,
    roles: { [Op.overlap]: SEARCHABLE_ROLES },
    [Op.or]: [
      { fullName: { [Op.iLike]: wrappedQuery } },
      { email: { [Op.iLike]: wrappedQuery } },
      { 'contacts.matrix': { [Op.iLike]: wrappedQuery } },
      { 'contacts.telegram': { [Op.iLike]: wrappedQuery } },
      { 'contacts.github': { [Op.iLike]: wrappedQuery } },
      { 'contacts.signal': { [Op.iLike]: wrappedQuery } },
    ],
  }
}

const getWhereClauseForTagSearch = (query: string) => {
  const wrappedQuery = `%${query}%`
  return {
    [Op.or]: [
      { name: { [Op.iLike]: wrappedQuery } },
      // TODO: make search by altNames better (ilike)
      { altNames: { [Op.overlap]: [query] } },
    ],
  }
}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/suggestion',
    async (req: FastifyRequest<{ Querystring: { query: string } }>, reply) => {
      req.check(Permissions.Use)

      const originalQuery = (req.query.query || '').trim().toLowerCase()
      if (!originalQuery) {
        return []
      }

      // instant result for an email query
      if (EMAIL_REGEX.test(originalQuery)) {
        const user = await fastify.db.User.findOneActive({
          where: {
            roles: { [Op.overlap]: SEARCHABLE_ROLES },
            email: originalQuery,
          },
        })
        if (user) {
          return [userToSearchSuggestion(user)]
        }
      }

      // instant result for a matrix username query
      if (fastify.integrations.Matrix?.usernameRegex?.test(originalQuery)) {
        const user = await fastify.db.User.findOneActive({
          where: {
            roles: { [Op.overlap]: SEARCHABLE_ROLES },
            'contacts.matrix': originalQuery,
          },
        })
        if (user) {
          return [userToSearchSuggestion(user)]
        }
      }

      // search users
      const users = await fastify.db.User.findAllActive({
        where: getWhereClauseForUserSearch(originalQuery),
        limit: 3,
      })

      // search tags
      const tags = await fastify.db.Tag.findAll({
        where: getWhereClauseForTagSearch(originalQuery),
        limit: 3,
      })

      const results: SearchSuggestion[] = [
        ...users.map(userToSearchSuggestion),
        ...tags.map(tagToSearchSuggestion),
      ]
      return results
    }
  )

  fastify.get(
    '/results',
    async (req: FastifyRequest<{ Querystring: { query: string } }>, reply) => {
      req.check(Permissions.Use)

      const originalQuery = (req.query.query || '').trim()
      const query = originalQuery.toLowerCase()

      // instant result for an email query
      if (EMAIL_REGEX.test(originalQuery)) {
        const user = await fastify.db.User.findOneActive({
          where: {
            roles: { [Op.overlap]: SEARCHABLE_ROLES },
            email: originalQuery,
          },
        })
        if (user) {
          return [userToSearchSuggestion(user)]
        }
      }

      // instant result for a matrix username query
      if (fastify.integrations.Matrix?.usernameRegex?.test(query)) {
        const user = await fastify.db.User.findOneActive({
          where: { 'contacts.matrix': query },
        })
        if (user) {
          return [userToSearchSuggestion(user)]
        }
      }

      // search users by tags only
      const tagNames = extractTagNames(originalQuery)
      if (tagNames.length) {
        const tags = await fastify.db.Tag.findAll({
          where: { name: { [Op.in]: tagNames } },
        })
        const tagIds = tags.map((x) => x.id)
        // FIXME: user sequelize built-in `include`
        // const users = await fastify.db.User.findAll({
        //   include: [{
        //     model: fastify.db.Tag,
        //     as: 'tags',
        //     through: {
        //       where: { tagId: { [Op.in]: tagIds } },
        //     },
        //     required: true,
        //   }],
        //   group: ['User.id'],
        //   having: where(fn('COUNT', col('tags.id')), tags.length),
        // })
        // return users

        // the following SQL query is used to find all users
        // who have all of the specified `tagIds` as attached tags
        const users = tagIds.length
          ? await fastify.sequelize.query(
              `
              select * from users
              right join (
                select "userId" from (
                  select "userId", count (distinct "tagId") "tagsCount" from (
                    select "userId", "tagId" from user_tags
                    where "tagId" in (${tagIds.map((x) => `'${x}'`).join(',')})
                  ) as q1
                  group by "userId"
                ) as q2
                where "tagsCount" = ${tagIds.length}
              ) as q3
              on users.id = q3."userId"
            `,
              {
                model: fastify.db.User,
                mapToModel: true,
              }
            )
          : []
        return users.map(userToSearchSuggestion)
      }

      // search by users
      const users = await fastify.db.User.findAllActive({
        where: getWhereClauseForUserSearch(query),
      })

      // search by tags
      const tags = await fastify.db.Tag.findAll({
        where: getWhereClauseForTagSearch(query),
      })

      const results: SearchSuggestion[] = [
        ...users.map(userToSearchSuggestion),
        ...tags.map(tagToSearchSuggestion),
      ]
      return results
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {}

module.exports = {
  userRouter,
  adminRouter,
}

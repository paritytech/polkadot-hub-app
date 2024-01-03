import dayjs from 'dayjs'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Filterable, Op } from 'sequelize'
import { appConfig } from '#server/app-config'
import config from '#server/config'
import {
  COUNTRIES,
  COUNTRY_COORDINATES,
  DATE_FORMAT,
  ADMIN_ACCESS_PERMISSION_RE,
} from '#server/constants'
import { AuthAccount } from '#shared/types'
import * as fp from '#shared/utils/fp'
import { Permissions } from '../permissions'
import {
  AuthProvider,
  GeoData,
  ImportedTag,
  ImportedTagGroup,
  OnboardingProfileRequest,
  ProfileRequest,
  Tag,
  User,
  UserTagsRequest,
} from '../types'
import {
  getDefaultLocation,
  getGeoDataInfo,
  getUserProviderQuery,
  removeAuthId,
} from './helpers'

import { Metadata } from '../metadata-schema'

const ROLES_ALLOWED_TO_BE_ON_MAP = appConfig.getRolesByPermission(
  Permissions.UseMap
)

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get('/metadata', async (req: FastifyRequest, reply) => {
    const metadata = appConfig.getModuleMetadata('users') as Metadata
    return metadata.profileFields
  })

  fastify.get('/me', async (req, reply) => {
    return {
      isAdmin: req.permissions.some((x) => ADMIN_ACCESS_PERMISSION_RE.test(x)),
      user: req.user.useMeView(), // FIXME: store countryName in the database (geodata)
      permissions: Array.from(req.permissions),
    }
  })

  fastify.put(
    '/me/limited',
    async (
      req: FastifyRequest<{ Body: { fullName: string; email: string } }>,
      reply
    ) => {
      req.check(Permissions.ManageProfileLimited)
      if (req.body.email) {
        const user = await fastify.db.User.findOneActive({
          where: { email: req.body.email },
        })
        if (user) {
          //@todo not sure if this is a good idea, as it can provide extra info
          return reply.throw.conflict('Email is already in use')
        }
      }
      await req.user
        .set({
          fullName: req.body.fullName,
          contacts: {
            email: req.body.email,
          },
        })
        .save()
    }
  )

  fastify.put(
    '/me',
    async (req: FastifyRequest<{ Body: ProfileRequest }>, reply) => {
      req.check(Permissions.ManageProfile)
      let geodata: GeoData = req.user.geodata as GeoData
      if (req.body.country) {
        geodata = await getGeoDataInfo(
          fastify,
          req.body.city,
          req.body.country,
          req.body?.geodata?.doNotShareLocation ?? false
        )
      }

      await req.user
        .set({
          fullName: req.body.fullName,
          birthday: req.body.birthday,
          department: req.body.department,
          team: req.body.team,
          jobTitle: req.body.jobTitle,
          country: req.body.country,
          city: req.body.city,
          contacts: {
            ...req.user.contacts,
            ...req.body.contacts,
          },
          bio: req.body.bio,
          isInitialised: true,
          geodata,
          defaultLocation: getDefaultLocation(
            req.body.city,
            req.body.country,
            appConfig.offices[0].id,
            appConfig.offices
          ),
        })
        .save()
      return reply.ok()
    }
  )

  fastify.post(
    '/me/onboarding',
    async (
      req: FastifyRequest<{ Body: Partial<OnboardingProfileRequest> }>,
      reply
    ) => {
      req.check(Permissions.UseOnboarding)
      if (req.user.isInitialised) {
        return reply.throw.rejected()
      }
      const userData: Partial<User> = {
        department: req.body.department || null,
        team: req.body.team || null,
        jobTitle: req.body.jobTitle || null,
        country: req.body.country || null,
        city: req.body.city || null,
        defaultLocation: getDefaultLocation(
          req.body.city ?? null,
          req.body.country ?? null,
          appConfig.offices[0].id,
          appConfig.offices
        ),
        contacts: req.body.contacts,
      }

      // build `geodata` field
      let geodata: User['geodata'] = { doNotShareLocation: false }

      if (userData.country) {
        geodata = await getGeoDataInfo(
          fastify,
          userData?.city ?? null,
          userData.country,
          false
        )
      }

      await req.user
        .set({
          ...userData,
          geodata,
          isInitialised: true,
        })
        .save()

      // add user tags
      const tagIds = req.body.tagIds || []
      if (tagIds.length) {
        const tags = await fastify.db.Tag.findAll({
          where: { id: { [Op.in]: tagIds } },
        })
        // FIXME: missed types for sequelize lazy loading methods (many-to-many relation)
        // @ts-ignore
        await req.user.setTags(tags)
      }

      return reply.ok()
    }
  )

  // NOTE: temporary route for the onboarding demo
  fastify.get('/me/reset', async (req, reply) => {
    req.check(Permissions.UseOnboarding)
    req.check(Permissions.AdminManage)
    await req.user
      .set({
        department: null,
        team: null,
        jobTitle: null,
        country: null,
        city: null,
        bio: null,
        birthday: null,
        contacts: {},
        geodata: {
          doNotShareLocation: false,
        },
        isInitialised: false,
      })
      .save()
    // FIXME: missed types for sequelize lazy loading methods (many-to-many relation)
    // @ts-ignore
    const tags = await req.user.getTags()
    if (tags.length) {
      // @ts-ignore
      await req.user.removeTags(tags)
    }
    return `Done. Visit ${config.appHost} again.`
  })

  fastify.put(
    '/me/geo',
    async (
      req: FastifyRequest<{
        Body: { geodata: GeoData; city: string | null; country: string | null }
      }>,
      reply
    ) => {
      req.check(Permissions.ManageProfile)

      let geodata: GeoData = await getGeoDataInfo(
        fastify,
        req.body.city,
        req.body.country,
        req.body?.geodata?.doNotShareLocation ?? false
      )

      let userData = {
        geodata,
        city: req.body.city ?? req.user.city,
        country: req.body.country ?? req.user.country,
      }
      await fastify.db.User.update(userData, { where: { id: req.user.id } })
      return reply.ok()
    }
  )

  fastify.get(
    '/profile/:userId',
    async (req: FastifyRequest<{ Params: { userId: string } }>, reply) => {
      req.check(Permissions.ListProfiles)
      const user = await fastify.db.User.findByPkActive(req.params.userId, {
        include: {
          as: 'tags',
          model: fastify.db.Tag,
        },
      })
      if (!user) {
        return reply.throw.notFound()
      }
      // @ts-ignore FIXME:
      return user.usePublicProfileView(user.tags, {
        forceHideGeoData: !req.can(Permissions.UseMap),
      })
    }
  )

  fastify.get(
    '/user/:userId',
    async (req: FastifyRequest<{ Params: { userId: string } }>, reply) => {
      req.check(Permissions.ListProfiles)
      const user = await fastify.db.User.findByPkActive(req.params.userId)
      if (!user) {
        return reply.throw.notFound()
      }
      return user.useCompactView()
    }
  )

  fastify.post(
    '/user/batch',
    async (req: FastifyRequest<{ Body: string[] }>, reply) => {
      req.check(Permissions.ListProfiles)
      const ids = req.body || []
      const filter: Filterable<User> = {}
      if (ids.length) {
        filter.where = { id: { [Op.in]: ids } }
      }
      return fastify.db.User.findAllCompactView(filter)
    }
  )

  fastify.get('/countries', async (req, reply) => {
    if (
      !req.permissions.hasAnyOf([
        Permissions.ManageProfile,
        Permissions.UseOnboarding,
        Permissions.UseMap,
      ])
    ) {
      return reply.throw.accessDenied()
    }
    return {
      list: COUNTRIES,
      coordinates: COUNTRY_COORDINATES,
    }
  })

  fastify.get(
    '/cities/suggestions',
    async (
      req: FastifyRequest<{
        Querystring: { query: string; countryCode: string }
      }>,
      reply
    ) => {
      if (
        !req.permissions.hasAnyOf([
          Permissions.ManageProfile,
          Permissions.UseOnboarding,
        ])
      ) {
        return reply.throw.accessDenied()
      }
      let { countryCode, query } = req.query
      query = (query || '').trim().toLowerCase()
      countryCode = (countryCode || '').trim().toLowerCase()
      if (!countryCode || !query || query.length < 3) return []
      const cities = await fastify.db.City.findAll({
        attributes: ['id', 'name', 'coordinates', 'timezone'],
        where: {
          countryCode: req.query.countryCode,
          [Op.or]: [
            { name: { [Op.iLike]: `%${query}%` } },
            // TODO: use altNames
            // { altNames: { [Op.overlap]: [query] } }
            // { altNames: { [Op.iLike]: `%${query}%` } }
          ],
        },
        order: ['name'],
      })
      return cities.map((x) => x.usePublicView())
    }
  )

  fastify.get(
    '/tags',
    async (
      req: FastifyRequest<{ Querystring: { groupBy?: 'category' } }>,
      reply
    ) => {
      if (
        !req.permissions.hasAnyOf([
          Permissions.ListProfiles,
          Permissions.ManageProfile,
        ])
      ) {
        return reply.throw.accessDenied()
      }
      const tags = await fastify.db.Tag.findAll({ order: [['order', 'ASC']] })
      if (req.query.groupBy === 'category') {
        const tagsByCategory = tags.reduce((acc, x) => {
          return {
            ...acc,
            [x.category]: acc[x.category] ? [...acc[x.category], x] : [x],
          }
        }, {} as Record<string, Tag[]>)
        const groupedTags = Object.keys(tagsByCategory)
          .map((c) => ({
            category: c,
            tags: tagsByCategory[c],
          }))
          .sort((a, b) => {
            const orderA = a.tags[0].order
            const orderB = b.tags[0].order
            return orderA > orderB ? 1 : -1
          })
        return groupedTags
      }
      return tags
    }
  )

  fastify.get('/me/tags', async (req, reply) => {
    req.check(Permissions.ManageProfile)
    req.check(Permissions.ListProfiles)
    // FIXME: missed types for sequelize lazy loading methods (many-to-many relation)
    // @ts-ignore
    const tags = (await req.user.getTags()) as Tag[]
    return tags
  })

  fastify.put(
    '/me/tags',
    async (req: FastifyRequest<{ Body: UserTagsRequest }>, reply) => {
      req.check(Permissions.ManageProfile)
      const tags = await fastify.db.Tag.findAll({
        where: { id: { [Op.in]: req.body || [] } },
      })
      // FIXME: missed types for sequelize lazy loading methods (many-to-many relation)
      // @ts-ignore
      await req.user.setTags(tags)
      return reply.ok()
    }
  )

  fastify.get('/map-pins', async (req, reply) => {
    req.check(Permissions.UseMap)
    return fastify.db.User.findAllActive({
      where: {
        [Op.and]: [
          { role: { [Op.in]: ROLES_ALLOWED_TO_BE_ON_MAP } },
          { 'geodata.doNotShareLocation': 'false' },
          { 'geodata.coordinates': { [Op.ne]: '[0, 0]' } },
        ],
      },
      attributes: [
        'fullName',
        'geodata',
        'jobTitle',
        'id',
        'email',
        'avatar',
        'city',
        'department',
        'team',
      ],
    })
  })

  fastify.get('/map-stats', async (req, reply) => {
    req.check(Permissions.UseMap)
    const users = await fastify.db.User.findAllActive({
      where: {
        [Op.and]: [
          { role: { [Op.in]: ROLES_ALLOWED_TO_BE_ON_MAP } },
          { 'geodata.doNotShareLocation': 'false' },
          { country: { [Op.ne]: null } },
        ],
      },
    })
    const uniqueCountries = [...new Set(users.map((user) => user.country))]

    return {
      userCount: users.length,
      countryCount: uniqueCountries.length,
    }
  })

  const PROVIDER_NAME = 'polkadot'

  fastify.put(
    '/settings/unlink',
    async (
      req: FastifyRequest<{
        Params: {}
        Body: AuthAccount
      }>,
      reply
    ) => {
      const authIds = req.user.authIds[PROVIDER_NAME] ?? []
      const alreadyLinked = authIds[req.body.extensionName]
        ? authIds[req.body.extensionName].find(
            (one) => one.address == req.body.address
          )
        : false
      if (!alreadyLinked) {
        return reply.throw.badParams()
      }
      const filteredData = removeAuthId(authIds, req.body.address)
      await fastify.db.User.update(
        { authIds: { polkadot: filteredData } },
        { where: { id: req.user.id } }
      )
      return reply.ok()
    }
  )

  fastify.put(
    '/settings/link',
    async (
      req: FastifyRequest<{
        Params: {}
        Body: AuthAccount
      }>,
      reply
    ) => {
      const extensionName = req.body.extensionName
      const providerAuthIds = req.user.authIds[AuthProvider.Polkadot] ?? []
      const extensionIds = providerAuthIds[extensionName] ?? []

      if (!!Object.keys(providerAuthIds).length && extensionIds) {
        const alreadyLinked = extensionIds.find(
          (one) => one.address == req.body.address
        )

        if (alreadyLinked) {
          return reply.throw.badParams(
            'You have already linked this address to your account'
          )
        }
      }

      const otherUsers = await fastify.db.User.findAllActive({
        where: getUserProviderQuery(
          PROVIDER_NAME,
          extensionName,
          req.body.address
        ),
      })

      if (!!otherUsers.length) {
        fastify.log.error(
          `The address  ${req.body.address} from provider ${PROVIDER_NAME}, extension: ${extensionName} has already been linked with user ${otherUsers[0].id}`
        )
        return reply.throw.badParams(
          'This address has already been connected to another account.'
        )
      }

      await req.user
        .addAuthId(AuthProvider.Polkadot, extensionName, {
          name: req.body.name,
          address: req.body.address,
        })
        .save()
      return reply.ok()
    }
  )

  fastify.delete(
    '/me',
    async (
      req: FastifyRequest<{
        Params: {}
      }>,
      reply
    ) => {
      if (!!req.user.scheduledToDelete) {
        return reply.throw.badParams(
          `Your data is already scheduled to be deleted on ${dayjs(
            req.user.scheduledToDelete
          ).format(DATE_FORMAT)}`
        )
      }
      await req.user.update({
        scheduledToDelete: dayjs().endOf('day').add(3, 'days').toDate(),
      })
      return reply.ok()
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/user',
    async (
      req: FastifyRequest<{ Querystring: { 'ids[]'?: string[] } }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      let ids = req.query['ids[]'] || []
      if (!Array.isArray(ids)) {
        ids = [ids]
      }
      const where: Filterable<User>['where'] = {}
      if (ids.length) {
        where.id = { [Op.in]: ids }
      }
      return fastify.db.User.findAllActive({ where })
    }
  )

  fastify.delete(
    '/users/:userId',
    async (req: FastifyRequest<{ Params: { userId: string } }>, reply) => {
      req.check(Permissions.AdminAssignRoles)
      const user = await fastify.db.User.findByPkActive(req.params?.userId)
      if (!user) {
        return reply.throw.badParams()
      }
      if (!!user.scheduledToDelete) {
        return reply.throw.badParams(
          `User is already scheduled to be deleted on ${dayjs(
            user.scheduledToDelete
          ).format(DATE_FORMAT)}`
        )
      }
      await user.update({
        scheduledToDelete: dayjs().endOf('day').add(3, 'days').toDate(),
      })
      return reply.ok()
    }
  )

  fastify.put(
    '/users/:userId/revert',
    async (req: FastifyRequest<{ Params: { userId: string } }>, reply) => {
      req.check(Permissions.AdminAssignRoles)
      const user = await fastify.db.User.findByPkActive(req.params.userId)
      if (!user) {
        return reply.throw.badParams()
      }
      await user.update({
        scheduledToDelete: null,
      })
      return reply.ok()
    }
  )

  fastify.put(
    '/user/:userId',
    async (
      req: FastifyRequest<{
        Params: { userId: string }
        Body: Pick<User, 'roles'>
      }>,
      reply
    ) => {
      req.check(Permissions.AdminAssignRoles)

      const newRoles = req.body.roles
      const availableRoles = appConfig.config.permissions.roles.map(
        fp.prop('id')
      )
      if (newRoles.some((x) => !availableRoles.includes(x))) {
        return reply.throw.badParams('Request contains an unsupported role')
      }

      const user = await fastify.db.User.findByPkActive(req.params.userId)
      if (!user) {
        return reply.throw.notFound()
      }
      const previousRoles = [...user.roles]
      await user.set({ roles: newRoles }).save()

      if (fastify.integrations.Matrix) {
        const rolesById = appConfig.config.permissions.roles.reduce(
          fp.by('id'),
          {}
        )
        const previousRoleNames = previousRoles.map(
          (x) => rolesById[x]?.name || x
        )
        const targetRoleNames = newRoles.map((x) => rolesById[x]?.name || x)
        const message = appConfig.templates.notification(
          'users',
          'roleChanged',
          {
            admin: req.user.usePublicProfileView(),
            user: user.usePublicProfileView(),
            previousRoleNames,
            targetRoleNames,
          }
        )
        if (message) {
          fastify.integrations.Matrix.sendMessageInAdminRoomDeferred(message)
        }
      }
      return reply.ok()
    }
  )

  fastify.post(
    '/tags/import',
    {
      schema: {
        body: {
          type: 'array',
          items: {
            type: 'object',
            required: ['category', 'tags'],
            properties: {
              category: { type: 'string' },
              tags: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['name', 'altNames'],
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    altNames: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 1,
                    },
                  },
                },
              },
            },
          },
          minItems: 0,
        },
      },
      attachValidation: true,
    },
    async (req: FastifyRequest<{ Body: ImportedTagGroup[] }>, reply) => {
      req.check(Permissions.AdminManage)
      if (req.validationError) {
        return reply.throw.badParams('Invalid JSON schema. Import rejected.')
      }
      const importedTagGroups = req.body
      const transaction = await fastify.sequelize.transaction()

      // 1. complete tag fields (order, category)
      const tags = importedTagGroups.reduce((acc, x, i) => {
        const groupTags = x.tags.map((t) => ({
          ...t,
          order: i + 1,
          category: x.category,
        }))
        return acc.concat(groupTags)
      }, [] as Array<ImportedTag & Pick<Tag, 'order' | 'category'>>)

      // 2. separate new tags that need to be created from the existing ones
      const tagsToInsert = tags.filter((x) => !x.id)
      const tagsToUpdate = tags.filter((x) => !!x.id)

      // 3. remove all tags missing from incoming json
      const tagIds = tagsToUpdate.map((x) => x.id!)
      await fastify.db.Tag.destroy({
        where: { id: { [Op.notIn]: tagIds } },
        transaction,
      })

      // 4. insert new tags
      await fastify.db.Tag.bulkCreate(tagsToInsert)

      // 5. update existing tags
      for (const tag of tagsToUpdate) {
        const tagRecord = await fastify.db.Tag.findByPk(tag.id!)
        if (!tagRecord) {
          fastify.log.warn(
            tag,
            `Unable to update the tag due to an invalid tag ID. Skipped.`
          )
          continue
        }
        await tagRecord
          .set({
            name: tag.name,
            altNames: tag.altNames,
            category: tag.category,
            order: tag.order,
          })
          .save({ transaction })
      }

      await transaction.commit()
      reply.ok()
    }
  )
}

module.exports = {
  userRouter,
  adminRouter,
}

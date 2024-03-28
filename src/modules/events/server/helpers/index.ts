import dayjs from 'dayjs'
import { User } from '#modules/users/server/models'
import config from '#server/config'
import { appConfig } from '#server/app-config'
import * as fp from '#shared/utils/fp'
import { EntityVisibility, Event, EventApplicationStatus } from '#shared/types'
import { Op } from 'sequelize'
import { FastifyInstance } from 'fastify'

export * as checklists from './checklists'
export * as globalEventTemplates from './global-event-templates'

export const getApplicationTemplateName = (status: string) =>
  `eventApplication${fp.camelcasify(status)}`

export const getApplicationMessage = (
  status: string,
  user: User,
  event: Event
): string | null =>
  appConfig.templates.notification(
    'events',
    getApplicationTemplateName(status),
    {
      user: user.usePublicProfileView(),
      event: {
        title: event.title,
        url: `${config.appHost}/event/${event.id}`,
        dates: `${dayjs(event.startDate).format('MMM D, HH:mm')} - ${dayjs(
          event.endDate
        ).format('MMM D, HH:mm')}`,
      },
    }
  )

export const getApplicationUpdateMessage = (
  status: string,
  user: User,
  event: Event
): string | null =>
  appConfig.templates.notification('events', 'eventApplicationUpdateForAdmin', {
    event: {
      title: event.title,
      url: `${config.appHost}/event/${event.id}`,
    },
    user: user.usePublicProfileView(),
    status,
  })

export const getUpcomingEventsForUser = async (
  fastify: FastifyInstance,
  user: User,
  officeId: string
) =>
  fastify.db.Event.findAll({
    include: {
      model: fastify.db.EventApplication,
      as: 'applications',
      where: {
        userId: user.id,
      },
      required: false,
    },
    where: {
      endDate: {
        [Op.gte]: new Date(),
      },
      visibility: EntityVisibility.Visible,
      allowedRoles: { [Op.overlap]: user.roles },
      offices: { [Op.contains]: [officeId] },
    },
    order: ['startDate'],
  })

export const getUpcomingEventApplicationsForUser = (
  fastify: FastifyInstance,
  userId: string
) =>
  fastify.db.EventApplication.findAll({
    include: {
      model: fastify.db.Event,
      as: 'event',
      where: {
        endDate: {
          [Op.gte]: new Date(),
        },
        visibility: {
          [Op.in]: [EntityVisibility.Visible, EntityVisibility.Url],
        },
      },
      attributes: [
        'id',
        'title',
        'startDate',
        'endDate',
        'coverImageUrl',
        'metadata',
        'checklist',
      ],
      required: true,
      order: [['startDate', 'ASC']],
    },
    where: {
      status: {
        [Op.in]: [
          EventApplicationStatus.Opened,
          EventApplicationStatus.Pending,
          EventApplicationStatus.Confirmed,
        ],
      },
      userId: userId,
    },
    attributes: ['eventId', 'status', 'id'],
  })

import dayjs from 'dayjs'
import { User } from '#modules/users/server/models'
import config from '#server/config'
import { appConfig } from '#server/app-config'
import * as fp from '#shared/utils/fp'
import { Event } from '#shared/types'

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

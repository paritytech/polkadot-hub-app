import { UniqueConstraintError } from 'sequelize'
import { CronJob, CronJobContext } from '#server/types'
import { EntityVisibility } from '#shared/types'
import * as fp from '#shared/utils/fp'
import {
  getGlobalEventDefaultChecklist,
  getGlobalEventDefaultContent,
} from '../helpers/global-event-templates'
import { Metadata } from '../../metadata-schema'

type MultiselectOption = {
  id: string
  name: string
  color: string
}

async function fetchAllPages(
  ctx: CronJobContext,
  params = {},
  data: Array<any> = []
) {
  const metadata = ctx.appConfig.getModuleMetadata('events') as Metadata
  if (!metadata?.notionGlobalEventsDatabaseId) return []
  try {
    if (!params) {
      params = {
        sorts: [
          {
            property: 'Dates',
            direction: 'ascending',
          },
        ],
      }
    }
    const response = await ctx.integrations.Notion.queryDatabase(
      metadata.notionGlobalEventsDatabaseId,
      params
    )
    data.push(...response.results)

    if (!response.has_more) {
      return data
    }
    const nextPageParams = {
      ...params,
      start_cursor: response.next_cursor,
    }

    return fetchAllPages(ctx, nextPageParams, data)
  } catch (error) {
    console.error('An error occurred while fetching data:', error)
  }
}

export const cronJob: CronJob = {
  name: 'update-notion-events',
  cron: '0 0 * * *',
  fn: async (ctx: CronJobContext) => {
    const metadata = ctx.appConfig.getModuleMetadata('events') as Metadata
    if (!metadata || metadata.notionGlobalEventsDatabaseId) return
    try {
      let eventList = await fetchAllPages(ctx)
      ctx.log.info(`There are ${eventList?.length} events in Notion.`)

      if (!eventList || !eventList.length) {
        return
      }

      for (const event of eventList) {
        const dbEvent = await ctx.models.Event.findOne({
          where: {
            'metadata.notionId': event?.id,
          },
        })
        const props = event.properties
        // we do not update existing events not to override data changes by administrators

        if (!dbEvent && !!props['Event Name'].title[0]) {
          const offices =
            metadata.officesWithGlobalEvents ||
            ctx.appConfig.offices.map((x) => x.id)

          const title = props['Event Name'].title[0].text.content
          ctx.log.info(`📝 Adding event ${title}`)

          const isCancelled = props.Status.multi_select.some(
            (option: MultiselectOption) => option.name === 'cancelled'
          )

          const isInternal = props.Type.multi_select.some(
            (option: MultiselectOption) =>
              // there is a space at the end of Internal type in the Notion table
              option.name.trim() === 'Internal'
          )

          const visibility = isCancelled
            ? EntityVisibility.None
            : EntityVisibility.Visible

          const allowedRoles = ctx.appConfig.config.permissions.roleGroups
            .map(fp.prop('roles'))
            .flat()
            .filter((x) => (isInternal ? x.accessByDefault : true))
            .map(fp.prop('id'))

          try {
            await ctx.models.Event.create({
              title: title,
              location: props.City.multi_select[0].name,
              metadata: {
                type: props.Type.multi_select[0].name,
                eventUrl: props.URL?.url,
                global: true,
                notionId: event.id,
                notionObjectType: event.object,
              },
              description: getGlobalEventDefaultContent(props.URL?.url),
              startDate: props.Dates.date.start,
              checklist: getGlobalEventDefaultChecklist(),
              endDate: props.Dates.date.end ?? props.Dates.date.start,
              confirmationRule: 'auto_confirm',
              notificationRule: 'none',
              creatorUserId: '00000000-0000-0000-0000-000000000000',
              visibility,
              offices,
              allowedRoles,
              responsibleUserIds: [],
            })
          } catch (e: unknown) {
            if (e instanceof Error) {
              // some events are entered in the table twice, we ignore those
              if (e instanceof UniqueConstraintError) {
                if (e.errors[0]?.message !== 'title must be unique') {
                  ctx.log.error(
                    `❌ SequelizeUniqueConstraintError: ${JSON.stringify(
                      e.errors
                    )}`
                  )
                }
              } else {
                ctx.log.error(
                  JSON.stringify(e.message).concat(JSON.stringify(e?.stack))
                )
              }
            }
          }
        } else {
          if (!!props['Event Name'].title.length) {
            ctx.log.info(
              `✅ Already tracking event ${props['Event Name'].title[0].text.content}`
            )
          } else {
            ctx.log.info(`❌ The event does not have a title`)
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        ctx.log.error(
          JSON.stringify(e?.message).concat(JSON.stringify(e?.stack))
        )
      }
    }
  },
}

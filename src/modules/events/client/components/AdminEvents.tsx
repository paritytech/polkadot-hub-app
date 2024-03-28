import { useStore } from '@nanostores/react'
import * as React from 'react'
import {
  EntityVisibilityTag,
  ENTITY_VISIBILITY_LABEL,
} from '#client/components/EntityVisibilityTag'
import {
  Button,
  H1,
  LabelWrapper,
  Link,
  Table,
  Tag,
  UserLabel,
  Filters,
  UserRoleLabel,
  WidgetWrapper,
  Placeholder,
} from '#client/components/ui'
import config from '#client/config'
import { OFFICE_BY_ID, USER_ROLE_BY_ID } from '#client/constants'
import Permissions from '#shared/permissions'
import * as stores from '#client/stores'
import { EntityVisibility, EventAdminResponse } from '#shared/types'
import { trimString } from '#client/utils'
import { by, prop } from '#shared/utils/fp'
import { formatDateRange } from '#client/utils'
import { useDocumentTitle } from '#client/utils/hooks'
import { useUsersCompact } from '#modules/users/client/queries'
import { useEventsAdmin } from '../queries'

export const AdminEvents = () => {
  useDocumentTitle('Events')
  const permissions = useStore(stores.permissions)
  const officeId = useStore(stores.officeId)
  const [officeFilter, setOfficeFilter] = React.useState<string | null>(
    officeId || null
  )
  const [visibilityFilter, setVisibilityFilter] =
    React.useState<EntityVisibility | null>(null)
  const { data: events, refetch: refetchForms } = useEventsAdmin(
    visibilityFilter,
    officeFilter
  )
  const userIds = React.useMemo(
    () => (events || []).map(prop('creatorUserId')),
    [events]
  )
  const { data: users } = useUsersCompact(userIds, {
    enabled: !!userIds.length,
    retry: true,
  })
  const usersById = React.useMemo(
    () => (users || []).reduce(by('id'), {}),
    [users]
  )

  // @todo implement soft deletion
  // const { mutate: deleteEvent } = useDeleteEvent(() => {
  //   refetchForms()
  //   showNotification('The event has been deleted', 'success')
  // })
  // const onRemove = React.useCallback(
  //   (event: EventAdminResponse) => (ev: React.MouseEvent<HTMLElement>) => {
  //     ev.preventDefault()
  //     if (
  //       confirm(
  //         `Are you sure you want to permanently delete "${event.title}" event? This will automatically delete all applications.`
  //       )
  //     ) {
  //       deleteEvent(event.id)
  //     }
  //   },
  //   []
  // )

  const columns = React.useMemo(
    () =>
      [
        {
          Header: 'Date',
          accessor: (event: EventAdminResponse) =>
            formatDateRange(event.startDate, event.endDate, true),
        },
        {
          Header: 'Title',
          accessor: (event: EventAdminResponse) =>
            permissions.has(Permissions.events.AdminManage) ? (
              <Link href={`/admin/events/${event.id}`} kind="secondary">
                {trimString(event.title)}
              </Link>
            ) : (
              trimString(event.title)
            ),
        },
        {
          Header: 'Event page',
          accessor: (event: EventAdminResponse) => (
            <Link target="_blank" href={`/event/${event.id}`} kind="secondary">
              Link
            </Link>
          ),
        },
        {
          Header: 'Applicants',
          accessor: (event: EventAdminResponse) => (
            <Link
              href={`/admin/events/${event.id}/applications`}
              kind="secondary"
            >
              {`View ${
                event.applicationsCount ? `(${event.applicationsCount})` : ''
              }`}
            </Link>
          ),
        },
        {
          Header: 'Data retention',
          accessor: (event: EventAdminResponse) =>
            event.purgeSubmissionsAfterDays
              ? `${event.purgeSubmissionsAfterDays} days`
              : 'Forever',
        },
        {
          Header: 'Form editor',
          accessor: (event: EventAdminResponse) =>
            event.formId ? (
              <Link
                target="_blank"
                href={`/admin/forms/${event.formId}`}
                kind="secondary"
              >
                Link
              </Link>
            ) : null,
        },
        {
          Header: 'Form page',
          accessor: (event: EventAdminResponse) =>
            event.formId ? (
              <Link
                target="_blank"
                href={`/event/${event.id}/application`}
                kind="secondary"
              >
                Link
              </Link>
            ) : null,
        },
        {
          Header: 'Creator',
          accessor: (event: EventAdminResponse) => {
            const user = usersById[event.creatorUserId]
            return <UserLabel user={user} />
          },
        },
        {
          Header: 'General access',
          accessor: (event: EventAdminResponse) => (
            <div>
              <EntityVisibilityTag visibility={event.visibility} />
              {event.visibility === EntityVisibility.Visible && (
                <span className="inline-block ml-1 -mr-1">
                  in{' '}
                  {event.offices.map((x) => (
                    <Tag key={x} color="gray" size="small" className="mr-1">
                      {OFFICE_BY_ID[x]?.name || x}
                    </Tag>
                  ))}
                </span>
              )}
            </div>
          ),
        },
        {
          Header: 'People with access',
          accessor: (event: EventAdminResponse) => (
            <span className="inline-block -mr-1">
              {event.allowedRoles.map((x) => (
                <UserRoleLabel key={x} role={x} className="mr-1" />
              ))}
            </span>
          ),
        },
        // permissions.has(Permissions.events.AdminManage) ? {
        //   Header: 'Actions',
        //   accessor: (event: EventAdminResponse) => (
        //     <Button size="small" onClick={onRemove(event)}>
        //       Delete
        //     </Button>
        //   ),
        // } : null,
      ].filter(Boolean),
    [usersById, permissions]
  )

  return (
    <WidgetWrapper>
      <div className="flex items-center mb-5">
        <H1 className="flex-1 mb-0">Events</H1>
        {permissions.has(Permissions.events.AdminManage) && (
          <Button href="/admin/events/new">Create event</Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-y-4 mb-6">
        <LabelWrapper label="General access">
          <Filters
            options={[
              { id: null, name: 'Any' },
              {
                id: EntityVisibility.None,
                name: ENTITY_VISIBILITY_LABEL[EntityVisibility.None],
              },
              {
                id: EntityVisibility.Url,
                name: ENTITY_VISIBILITY_LABEL[EntityVisibility.Url],
              },
              {
                id: EntityVisibility.Visible,
                name: ENTITY_VISIBILITY_LABEL[EntityVisibility.Visible],
              },
            ]}
            onChange={setVisibilityFilter}
            value={visibilityFilter}
            multiple={false}
          />
        </LabelWrapper>
        <LabelWrapper label="Office">
          <Filters
            options={[
              { id: null, name: 'Any' },
              ...config.offices.map((o) => ({ id: o.id, name: o.name })),
            ]}
            onChange={setOfficeFilter}
            value={officeFilter}
            multiple={false}
          />
        </LabelWrapper>
      </div>

      {events?.length ? (
        <div className="-mx-6">
          <Table columns={columns} data={events} paddingClassName="px-6" />
        </div>
      ) : (
        <Placeholder children="No data" />
      )}
    </WidgetWrapper>
  )
}

import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { Button, H1, Link, Table, UserLabel } from '#client/components/ui'
import * as React from 'react'
import { useAdminAnnouncements } from '../queries'
import * as stores from '#client/stores'
import { by, prop } from '#shared/utils'
import { useUsersCompact } from '#modules/users/client/queries'
import { useStore } from '@nanostores/react'
import { trimString } from '#client/utils'
import Permissions from '#shared/permissions'
import { formatDate, isCurrentlyHappening, isDateInPast } from '../helpers'
import { AnnouncementItem } from '#shared/types'

export const AdminAnnouncements = () => (
  <PermissionsValidator
    required={[Permissions.announcements.__Admin]}
    onRejectGoHome
  >
    <_AdminAnnouncements />
  </PermissionsValidator>
)

export const _AdminAnnouncements: React.FC<{}> = () => {
  const officeId = useStore(stores.officeId)
  const { data: announcements } = useAdminAnnouncements(officeId)
  const userIds = React.useMemo(
    () => (announcements || []).map(prop('creatorUserId')),
    [announcements]
  )
  const { data: users } = useUsersCompact(userIds, {
    enabled: !!userIds.length,
    retry: false,
  })
  const usersById = React.useMemo(
    () => (users || []).reduce(by('id'), {}),
    [users]
  )

  const columns = React.useMemo(
    () => [
      {
        Header: 'Title',
        accessor: (one: AnnouncementItem) => (
          <Link href={`/admin/announcements/${one.id}`} kind="secondary">
            {trimString(one.title)}
          </Link>
        ),
      },
      {
        Header: 'Creator',
        accessor: (one: any) => {
          const user = usersById[one.creatorUserId]
          return <UserLabel user={user} />
        },
      },
      {
        Header: 'Scheduled on',
        accessor: (one: any) => (
          <div
            className={`${
              isCurrentlyHappening(one.scheduledAt, one.expiresAt)
                ? 'text-green-400'
                : isDateInPast(one.expiresAt)
                ? 'text-gray-400'
                : 'text-black'
            }`}
          >
            {formatDate(one.scheduledAt)}
          </div>
        ),
      },
      {
        Header: 'Expires on',
        accessor: (one: any) => (
          <div
            className={`${
              isCurrentlyHappening(one.scheduledAt, one.expiresAt)
                ? 'text-green-400'
                : isDateInPast(one.expiresAt)
                ? 'text-gray-400'
                : 'text-black'
            }`}
          >
            {formatDate(one.expiresAt)}
          </div>
        ),
      },
      {
        Header: 'Offices',
        accessor: (one: any) => <div>{one.offices.join(', ')}</div>,
      },
    ],
    [usersById]
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <H1>Announcements</H1>
        <PermissionsValidator required={[Permissions.announcements.__Admin]}>
          <Button href="/admin/announcements/new">Create</Button>
        </PermissionsValidator>
      </div>
      {announcements?.length ? (
        <div className="-mx-8">
          <Table columns={columns} data={announcements} />
        </div>
      ) : (
        <div className="text-gray-400 text-center my-12">No data</div>
      )}
    </div>
  )
}

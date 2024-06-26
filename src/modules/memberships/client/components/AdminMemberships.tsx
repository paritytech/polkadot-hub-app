import {
  Button,
  H1,
  Link,
  Placeholder,
  Table,
  UserLabel,
  WidgetWrapper,
} from '#client/components/ui'
import { useDocumentTitle } from '#client/utils/hooks'
import { useStore } from '@nanostores/react'
import { useMemo, useState } from 'react'
import * as stores from '#client/stores'
import { useMembershipsAdmin } from '../queries'
import { Membership } from '#modules/memberships/server/models'
import { trimString } from '#client/utils'
import { useUsersCompact } from '#modules/users/client/queries'
import { by, prop } from '#shared/utils'

export const AdminMemberships: React.FC = () => {
  useDocumentTitle('Memberships')
  const permissions = useStore(stores.permissions)
  const officeId = useStore(stores.officeId)
  const [officeFilter, setOfficeFilter] = useState<string | null>(
    officeId || null
  )

  const { data: memberships, refetch: refetchForms } =
    useMembershipsAdmin(officeFilter)
  const userIds = useMemo(
    () => (memberships || []).map(prop('creatorUserId')),
    [memberships]
  )
  const { data: users } = useUsersCompact(userIds, {
    enabled: !!userIds.length,
    retry: true,
  })
  const usersById = useMemo(() => (users || []).reduce(by('id'), {}), [users])
  const columns = useMemo(
    () =>
      [
        {
          Header: 'Title',
          accessor: (membership: Membership) => (
            // permissions.has(Permissions.memberships.AdminMemberships) ? (
            <Link href={`/admin/memberships/${membership.id}`} kind="secondary">
              {trimString(membership.title)}
            </Link>
          ),
        },
        {
          Header: 'Price',
          accessor: (membership: Membership) => membership.price,
        },
        {
          Header: 'Currency',
          accessor: (membership: Membership) => membership.currency,
        },

        {
          Header: 'Duration',
          accessor: (membership: Membership) => membership.durationInDays,
        },
        {
          Header: 'Creator',
          accessor: (membership: Membership) => {
            const user = usersById[membership.creatorUserId]
            return <UserLabel user={user} />
          },
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
        <H1 className="flex-1 mb-0">Memberships</H1>
        {/* {permissions.has(Permissions.events.AdminManage) && ( */}
        <Button href="/admin/memberships/new">Create membership</Button>
        {/* )} */}
      </div>
      {memberships?.length ? (
        <div className="-mx-6">
          <Table columns={columns} data={memberships} paddingClassName="px-6" />
        </div>
      ) : (
        <Placeholder children="No data" />
      )}
    </WidgetWrapper>
  )
}

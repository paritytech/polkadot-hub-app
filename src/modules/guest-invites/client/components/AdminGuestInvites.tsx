import React from 'react'
import dayjs from 'dayjs'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { GuestInvite } from '#shared/types'
import { by, prop, uniq } from '#shared/utils/fp'
import { useDocumentTitle } from '#client/utils/hooks'
import { DATE_FORMAT } from '#client/constants'
import { Button, Link, Table, Tag, H1, UserLabel } from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import Permissions from '#shared/permissions'
import { useUsersCompact } from '#modules/users/client/queries'
import { useGuestInvitesAdmin, useUpdateGuestInvite } from '../queries'
import { GuestInviteStatusTag } from './GuestInviteStatusTag'

export const AdminGuestInvites = () => (
  <PermissionsValidator
    required={[
      Permissions['guest-invites'].__Admin,
      Permissions['guest-invites'].AdminList,
    ]}
    onRejectGoHome
  >
    <_AdminGuestInvites />
  </PermissionsValidator>
)

export const _AdminGuestInvites: React.FC = () => {
  useDocumentTitle('Guest Invites')
  const officeId = useStore(stores.officeId)
  const { data: invites, refetch: refetchGuestInvites } =
    useGuestInvitesAdmin(officeId)

  const userIds = React.useMemo(() => {
    return (invites || [])
      .map(prop('creatorUserId'))
      .reduce(uniq, [] as string[])
  }, [invites])
  const { data: users = [] } = useUsersCompact(userIds)
  const usersById = React.useMemo(() => {
    return (users || []).reduce(by('id'), {})
  }, [users])

  const { mutate: updateGuestInvite } = useUpdateGuestInvite(() => {
    refetchGuestInvites()
  })
  const rejectGuestInvite = React.useCallback(
    (id: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      updateGuestInvite({ id, data: { status: 'rejected' } })
    },
    [updateGuestInvite]
  )

  const columns = React.useMemo(
    () => [
      {
        Header: 'Created at',
        accessor: (invite: GuestInvite) =>
          dayjs(invite.createdAt).format('D MMM, HH:mm'),
      },
      {
        Header: 'Visit dates',
        accessor: (invite: GuestInvite) =>
          (invite.dates || []).map((x, i) => {
            const date = dayjs(x, DATE_FORMAT).format('D MMM')
            return (
              <span key={date}>
                <Tag color="gray" size="small">
                  {date}
                </Tag>
                {i !== invite.dates.length - 1 && ', '}
              </span>
            )
          }),
      },
      {
        Header: 'Guest name',
        accessor: (invite: GuestInvite) => invite.fullName,
      },
      {
        Header: 'Guest email',
        accessor: (invite: GuestInvite) => (
          <Link href={`mailto:${invite.email}`} kind="secondary">
            {invite.email}
          </Link>
        ),
      },
      {
        Header: 'Inviter',
        accessor: (invite: GuestInvite) => {
          const user = usersById[invite.creatorUserId]
          return <UserLabel user={user} />
        },
      },
      {
        Header: 'Status',
        accessor: (invite: GuestInvite) => (
          <GuestInviteStatusTag status={invite.status} />
        ),
      },
      {
        Header: 'Actions',
        accessor: (invite: GuestInvite) => (
          <span>
            {invite.status === 'opened' && (
              <Button
                kind="primary"
                color="green"
                size="small"
                href={`/admin/guest-invites/${invite.id}`}
              >
                Confirm
              </Button>
            )}
            {['opened', 'pending'].includes(invite.status) && (
              <Button
                kind="primary"
                color="red"
                size="small"
                onClick={rejectGuestInvite(invite.id)}
                className="ml-1"
              >
                Reject
              </Button>
            )}
          </span>
        ),
      },
    ],
    [usersById]
  )

  return (
    <div>
      <H1>Guest invites</H1>
      {invites?.length ? (
        <div className="-mx-8">
          <Table columns={columns} data={invites} />
        </div>
      ) : (
        <div className="text-gray-400 text-center my-12">No data</div>
      )}
    </div>
  )
}

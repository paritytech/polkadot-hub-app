import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import * as React from 'react'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { Button, H1, P, Table, UserLabel } from '#client/components/ui'
import { DATE_FORMAT } from '#client/constants'
import Permissions from '#shared/permissions'
import * as stores from '#client/stores'
import { renderComponent } from '#client/utils/portal'
import { RootComponentProps, User, Visit } from '#shared/types'
import { groupBy, prop } from '#shared/utils/fp'
import { useDocumentTitle } from '#client/utils/hooks'
import { useUsersCompact } from '#modules/users/client/queries'
import { useUpdateVisitAdmin, useVisitsAdmin } from '../queries'
import { VisitStatusTag } from './VisitStatusTag'

export const AdminVisits: React.FC<RootComponentProps> = ({ portals }) => (
  <PermissionsValidator
    required={[Permissions.visits.__Admin, Permissions.visits.AdminList]}
    onRejectGoHome
  >
    <_AdminVisits portals={portals} />
  </PermissionsValidator>
)

export const _AdminVisits: React.FC<RootComponentProps> = ({ portals }) => {
  useDocumentTitle('Visits')
  const officeId = useStore(stores.officeId)
  const { data: visits, refetch: refetchVisits } = useVisitsAdmin(officeId)
  const userIds = React.useMemo(() => {
    if (!visits) return []
    return Array.from(new Set(visits.map(prop('userId'))))
  }, [visits])
  const { data: users } = useUsersCompact(userIds, {
    enabled: !!userIds.length,
    retry: false,
  })
  const usersById: Record<string, User> = React.useMemo(
    () => (users || []).reduce((acc, x) => ({ ...acc, [x.id]: x }), {}),
    [users]
  )

  const { mutate: updateVisit } = useUpdateVisitAdmin(() => {
    refetchVisits()
  })
  const onApprove = React.useCallback(
    (id: string) => () => {
      if (window.confirm('Are you sure you want to approve?')) {
        updateVisit({ id, status: 'confirmed' })
      }
    },
    []
  )
  const onReject = React.useCallback(
    (id: string) => () => {
      if (window.confirm('Are you sure you want to reject?')) {
        updateVisit({ id, status: 'cancelled' })
      }
    },
    []
  )

  const visitsByDate = React.useMemo(
    () => (visits || []).reduce(groupBy('date'), {} as Record<string, Visit[]>),
    [visits]
  )

  const sortedDates = React.useMemo(() => {
    return Object.keys(visitsByDate).sort((a, b) => {
      const aDate = dayjs(a, DATE_FORMAT)
      const bDate = dayjs(b, DATE_FORMAT)
      return aDate > bDate ? 1 : -1
    })
  }, [visitsByDate])

  const columns = React.useMemo(
    () => [
      {
        Header: 'Person',
        accessor: (x: Visit) => {
          const user = usersById[x.userId]
          return (
            <div className="flex gap-2">
              {' '}
              <UserLabel user={user} />
              {x.metadata?.guestInvite && (
                <p className="text-sm">(guest: {x.metadata?.guestFullName})</p>
              )}
            </div>
          )
        },
      },
      {
        Header: 'Workplace',
        accessor: (x: Visit) => (
          <span>
            {x.areaName}, {x.deskName}
          </span>
        ),
      },
      {
        Header: 'Status',
        accessor: (x: Visit) => <VisitStatusTag status={x.status} />,
      },
      {
        Header: 'Actions',
        accessor: (x: Visit) => {
          const user = usersById[x.userId]
          let showApprove = false
          let showReject = false
          switch (x.status) {
            case 'cancelled': {
              showApprove = true
              break
            }
            case 'pending': {
              showApprove = true
              showReject = true
              break
            }
            case 'confirmed': {
              showReject = true
              break
            }
          }
          return (
            <span>
              <Button
                kind="primary"
                disabled={!showApprove}
                className="mr-2"
                size="small"
                color="green"
                onClick={onApprove(x.id)}
              >
                Approve
              </Button>
              <Button
                kind="primary"
                disabled={!showReject}
                className="mr-2"
                size="small"
                color="red"
                onClick={onReject(x.id)}
              >
                Reject
              </Button>
              <Button size="small" href={`mailto:${user?.email}`}>
                Email
              </Button>
            </span>
          )
        },
      },
    ],
    [usersById]
  )

  return (
    <div>
      <H1>Visits</H1>

      {portals['admin_visits_header']?.map(renderComponent())}

      {sortedDates.map((date, i) => {
        const day = dayjs(date, DATE_FORMAT)
        const dayVisits = visitsByDate[date] || []
        const isToday = day.isSame(dayjs(), 'day')
        return (
          <div key={date}>
            <div className="block mb-2 mt-4">
              {day.format('dddd, MMM D')}
              {isToday ? (
                <span className="ml-2 text-gray-400">Today</span>
              ) : null}
            </div>
            {dayVisits.length ? (
              <div className="-mx-8">
                <Table columns={columns} data={dayVisits} hideHeader={!!i} />
              </div>
            ) : (
              <div className="text-center my-6 text-gray-400">No visits</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

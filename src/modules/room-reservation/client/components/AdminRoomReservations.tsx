import dayjs from 'dayjs'
import dayjsTimezone from 'dayjs/plugin/timezone'
import * as React from 'react'
import { useStore } from '@nanostores/react'
import config from '#client/config'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { showNotification } from '#client/components/ui/Notifications'
import {
  Button,
  H1,
  Placeholder,
  Table,
  Tag,
  UserLabel,
  WidgetWrapper,
} from '#client/components/ui'
import Permissions from '#shared/permissions'
import * as stores from '#client/stores'
import { OfficeRoom, RoomReservation } from '#shared/types'
import { by, nonNullable, prop, propEq } from '#shared/utils/fp'
import { useDocumentTitle, useOffice } from '#client/utils/hooks'
import { useUsersCompact } from '#modules/users/client/queries'
import {
  useRoomReservationsAdmin,
  useRooms,
  useUpdateRoomReservation,
} from '../queries'
import { RoomReservationStatusTag } from './RoomReservationStatusTag'

dayjs.extend(dayjsTimezone)

export const AdminRoomReservations = () => {
  const officeId = useStore(stores.officeId)
  return (
    <PermissionsValidator
      officeId={officeId}
      required={[
        Permissions['room-reservation'].__Admin,
        Permissions['room-reservation'].AdminList,
      ]}
      onRejectGoHome
    >
      <_AdminRoomReservations />
    </PermissionsValidator>
  )
}

const _AdminRoomReservations: React.FC = () => {
  useDocumentTitle('Meeting Rooms')
  const permissions = useStore(stores.permissions)
  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId)
  const { data: reservations, refetch: refetchReservations } =
    useRoomReservationsAdmin(officeId)
  // const [showDevices, setShowDevices] = React.useState<boolean>(false)

  const userIds = React.useMemo(
    () => (reservations || []).map(prop('creatorUserId')).filter(nonNullable),
    [reservations]
  )
  const { data: users = [] } = useUsersCompact(userIds, {
    enabled: !!userIds.length,
    retry: false,
  })
  const usersById = React.useMemo(() => users.reduce(by('id'), {}), [users])
  const { data: rooms = [] } = useRooms(officeId, true)
  const roomsById = React.useMemo<Record<string, OfficeRoom>>(
    () => rooms.reduce(by('id'), {}),
    [rooms]
  )

  const { mutate: updateReservation } = useUpdateRoomReservation(() => {
    showNotification('The room reservation has been updated', 'success')
    refetchReservations()
  })
  const onConfirm = React.useCallback(
    (reservation: RoomReservation) => (ev: React.MouseEvent) => {
      updateReservation({ id: reservation.id, data: { status: 'confirmed' } })
    },
    []
  )
  const onReject = React.useCallback(
    (reservation: RoomReservation) => (ev: React.MouseEvent) => {
      if (window.confirm('Are you sure you want to cancel this reservation?')) {
        updateReservation({ id: reservation.id, data: { status: 'cancelled' } })
      }
    },
    []
  )

  const columns = React.useMemo(
    () =>
      [
        {
          Header: 'Created at',
          accessor: (x: RoomReservation) =>
            dayjs(x.createdAt).format('D MMM YYYY, HH:mm'),
        },
        {
          Header: 'Status',
          accessor: (x: RoomReservation) => (
            <RoomReservationStatusTag status={x.status} size="small" />
          ),
        },
        {
          Header: 'Creator',
          accessor: (x: RoomReservation) => {
            const user = usersById[x.creatorUserId || '']
            return <UserLabel user={user} />
          },
        },
        {
          Header: 'Time (local)',
          accessor: (x: RoomReservation) => {
            const startDate = dayjs(x.startDate).tz(office?.timezone)
            const endDate = dayjs(x.endDate).tz(office?.timezone)
            return `${startDate.format('D MMM, HH:mm')} - ${endDate.format(
              'HH:mm'
            )}`
          },
        },
        {
          Header: 'Room',
          accessor: (x: RoomReservation) => {
            const office = config.offices.find(propEq('id', officeId))
            const room = roomsById[x.roomId || '']
            return `${office?.name || 'UNKNOWN OFFICE'} / ${
              room?.name || 'UNKNOWN'
            }`
          },
        },
        permissions.has(Permissions['room-reservation'].AdminManage, officeId)
          ? {
              Header: 'Actions',
              accessor: (x: RoomReservation) => {
                if (x.status === 'pending') {
                  return (
                    <>
                      <Button
                        size="small"
                        onClick={onConfirm(x)}
                        className="mr-2"
                      >
                        Confirm
                      </Button>
                      <Button size="small" onClick={onReject(x)}>
                        Reject
                      </Button>
                    </>
                  )
                }
                if (x.status === 'confirmed') {
                  return (
                    <>
                      <Button size="small" onClick={onReject(x)}>
                        Cancel
                      </Button>
                    </>
                  )
                }
                return null
              },
            }
          : null,
      ].filter(Boolean),
    [officeId, office, usersById, roomsById]
  )

  return (
    <WidgetWrapper>
      <H1 className="mb-6">Room reservations</H1>
      {reservations?.length ? (
        <div className="-mx-6">
          <Table
            columns={columns}
            data={reservations}
            paddingClassName="px-6"
          />
        </div>
      ) : (
        <Placeholder children="No data" />
      )}
    </WidgetWrapper>
  )
}

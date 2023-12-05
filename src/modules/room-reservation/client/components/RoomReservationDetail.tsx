import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useRoomReservation, useUpdateRoomReservationByUser } from '../queries'
import {
  ComponentWrapper,
  FButton,
  H2,
  HeaderWrapper,
  P,
  UserLabel,
  showNotification,
} from '#client/components/ui'
import dayjs from 'dayjs'
import { DATE_FORMAT_DAY_NAME_FULL } from '#client/constants'
import { useMemo } from 'react'
import { RoomReservationStatusTag } from './RoomReservationStatusTag'
import { useUserAdmin } from '#modules/users/client/queries'

export const RoomReservationDetail = () => (
  <PermissionsValidator required={[]} onRejectGoHome>
    <_RoomReservationDetail />
  </PermissionsValidator>
)

const _RoomReservationDetail = () => {
  const me = useStore(stores.me)
  const page = useStore(stores.router)
  const officeId = useStore(stores.officeId)
  const roomReservationId =
    page?.route === 'roomReservationDetail' ? page.params.roomReservationId : ''
  const { data: roomReservation = null, refetch: refetchReservation } =
    useRoomReservation(officeId, roomReservationId)

  const room = useMemo(() => roomReservation?.roomDetail, [roomReservation])

  const { mutate: updateRoomReservation } = useUpdateRoomReservationByUser(
    () => {
      showNotification(`Successfully cancelled.`, 'success')
      refetchReservation()
    }
  )
  const isOwner = useMemo(
    () => roomReservation?.creatorUserId === me?.id,
    [roomReservation, me]
  )
  const { data: user = null } = useUserAdmin(
    roomReservation?.creatorUserId || '',
    {
      enabled: !!roomReservation && roomReservation.creatorUserId !== me?.id,
    }
  )

  const onCancel = () => {
    const confirmMessage = `Are you sure you want to cancel this meeting room booking for ${room?.name}?`
    if (window.confirm(confirmMessage)) {
      updateRoomReservation({
        id: roomReservation?.id ?? '',
        status: 'cancelled',
      })
    }
  }

  return (
    <ComponentWrapper>
      {!!roomReservation && !!room && (
        <HeaderWrapper title="Meeting room booking">
          <div className="sm:px-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col gap-1">
                <H2 className="text-md m-0">
                  {dayjs(roomReservation.startDate).format(
                    DATE_FORMAT_DAY_NAME_FULL
                  )}{' '}
                  <br />
                  {dayjs(roomReservation.startDate).format('H:mm')} -{' '}
                  {dayjs(roomReservation.endDate).format('H:mm')}
                </H2>
                {!isOwner && !!user && (
                  <div className="mb-4">
                    <UserLabel user={user} />
                  </div>
                )}
                <div>
                  <P className="m-0 font-bold">{room.name}</P>
                  <P className="m-0">{roomReservation.officeName} office</P>
                </div>
                <div className="mt-4">
                  <RoomReservationStatusTag
                    status={roomReservation.status}
                    size="normal"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 min-w-[224px]">
                <FButton
                  kind="secondary"
                  className="text-black"
                  onClick={() => onCancel()}
                >
                  Cancel Booking
                </FButton>
                <FButton
                  kind="primary"
                  onClick={() => stores.goTo('roomReservationRequest')}
                >
                  New Booking
                </FButton>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center sm:justify-between bg-fill-6 rounded-md p-6 mt-6">
              <div className="m max-w-[260px]">
                <P className="font-bold mb-0">{room.name}</P>
                <P className="my-0">{roomReservation.officeName} office</P>
                <P className="mt-0">
                  {room.description} {room.description && room.capacity && '·'}{' '}
                  {room.capacity} people
                </P>
                <P className="text-text-secondary">{room.equipment}</P>
              </div>
              <img
                src={room.photo}
                className="rounded-sm h-full w-full sm:h-[200px] sm:w-[200px]"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </HeaderWrapper>
      )}
    </ComponentWrapper>
  )
}

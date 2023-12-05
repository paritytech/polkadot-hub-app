import * as React from 'react'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { useStore } from '@nanostores/react'
import { FButton, WidgetWrapper } from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import * as stores from '#client/stores'
import {
  GenericVisit,
  GuestInviteStatus,
  RoomReservationStatus,
  VisitStatus,
  VisitType,
} from '#shared/types'
import { useUpdateGuestInviteByUser } from '#modules/guest-invites/client/queries'
import { useUpdateVisit } from '#modules/visits/client/queries'
import { useUpdateRoomReservationByUser } from '#modules/room-reservation/client/queries'
import { PAGE_SIZE, paginateObject, RESERVATION_TYPES } from '../helpers'
import { useOfficeVisits } from '../queries'
import { Visit as VisitBlock } from './Visit'

dayjs.extend(localizedFormat)

export const MyOfficeVisits = () => {
  const officeId = useStore(stores.officeId)
  const [visitDates, setVisitDates] = React.useState<string[] | []>([])
  const [visitData, setVisitData] = React.useState<
    Record<string, Array<GenericVisit>>
  >({})
  const [noMoreData, setNoMoreData] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const {
    data: visits,
    isFetching,
    refetch: refetchVisits,
  } = useOfficeVisits(officeId, dayjs().toString())

  React.useEffect(() => {
    if (visits) {
      let limit = page === 1 ? PAGE_SIZE : page * PAGE_SIZE
      const result = paginateObject(visits, 1, limit)
      setVisitDates(Object.keys(visits))
      if (page > 1) {
        setVisitData({ ...visitData, ...result })
      } else {
        setVisitData({ ...result })
      }
      setNoMoreData(Object.keys(visits).length <= limit)
    }
  }, [visits, officeId, page])

  const cancellationCallback = () => {
    showNotification(`Successfully cancelled.`, 'success')
    refetchVisits()
  }
  const { mutate: updateVisit } = useUpdateVisit(cancellationCallback)
  const { mutate: updateRoomReservation } =
    useUpdateRoomReservationByUser(cancellationCallback)
  const { mutate: updateGuestInvite } =
    useUpdateGuestInviteByUser(cancellationCallback)

  type updateData = {
    id: string
    status: VisitStatus | RoomReservationStatus | GuestInviteStatus
  }
  const updateFns: Record<string, (data: any) => void> = {
    [VisitType.Visit]: (data: updateData & { status: VisitStatus }) =>
      updateVisit(data),
    [VisitType.Guest]: (data: updateData & { status: GuestInviteStatus }) =>
      updateGuestInvite(data),
    [VisitType.RoomReservation]: (
      data: updateData & { status: RoomReservationStatus }
    ) => updateRoomReservation(data),
  }

  const onEntityCancel = (id: string, type: string) => {
    const confirmMessage = `Are you sure you want to cancel this ${RESERVATION_TYPES[type]}?`
    if (window.confirm(confirmMessage)) {
      const data: updateData = {
        id,
        status: 'cancelled',
      }
      updateFns[type](data)
    }
  }
  if (!visitDates.length) {
    return <></>
  }

  return (
    <WidgetWrapper title="My Office Visits">
      {isFetching && !visitDates ? (
        <div>Loading...</div>
      ) : (
        <div className="flex flex-col gap-1">
          {!!visitDates.length &&
            !!visitData &&
            visitDates.map(
              (date: string, idx: number) =>
                visitData[date] && (
                  <VisitBlock
                    data={visitData[date]}
                    dataTypes={[VisitType.RoomReservation, VisitType.Guest]}
                    date={date}
                    idx={idx}
                    key={`${date}${idx}`}
                    onEntityCancel={onEntityCancel}
                  />
                )
            )}
        </div>
      )}
      {!noMoreData && (
        <FButton
          kind="link"
          className="w-auto mt-3"
          onClick={() => setPage(page + 1)}
        >
          Show more
        </FButton>
      )}
    </WidgetWrapper>
  )
}

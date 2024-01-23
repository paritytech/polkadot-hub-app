import { BackButton, showNotification } from '#client/components/ui'
import { useOffice } from '#client/utils/hooks'
import { useUpdateVisit } from '#modules/visits/client/queries'
import { useStore } from '@nanostores/react'
import dayjs, { Dayjs } from 'dayjs'
import React from 'react'
import * as stores from '#client/stores'
import { useUpdateRoomReservationByUser } from '#modules/room-reservation/client/queries'
import { useUpdateGuestInviteByUser } from '#modules/guest-invites/client/queries'
import {
  DailyEventType,
  GuestInviteStatus,
  RoomReservationStatus,
  VisitStatus,
  VisitType,
} from '#shared/types'
import { useOfficeVisitsUpcoming } from '#modules/office-visits/client/queries'
import { FRIENDLY_DATE_FORMAT } from '#client/constants'
import { DailyEvent } from './DailyEvent'

export const DailyEventsList: React.FC<{
  onChooseCard: (
    deskId: string | null,
    areaId: string | null,
    date: Dayjs
  ) => void
  setDate: (d: Dayjs) => void
  date: Dayjs
  className?: string
}> = ({ onChooseCard, setDate, date, className }) => {
  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId)
  const [upcomingEvents, setUpcomingEvents] = React.useState([])
  const [selected, setSelected] = React.useState<DailyEventType | null>(null)

  const cancellationCallback = () => {
    showNotification(`Successfully cancelled.`, 'success')
    refetchVisits()
  }

  const me = useStore(stores.me)
  const { mutate: updateVisit } = useUpdateVisit(cancellationCallback)
  const { mutate: updateRoomReservation } =
    useUpdateRoomReservationByUser(cancellationCallback)
  const { mutate: updateGuestInvite } =
    useUpdateGuestInviteByUser(cancellationCallback)

  type updateData = {
    id: string
    status: VisitStatus | RoomReservationStatus | GuestInviteStatus
  }

  const { data: myUpcomingVisits, refetch: refetchVisits } =
    useOfficeVisitsUpcoming(officeId, dayjs().toString(), me?.id)

  React.useEffect(() => {
    if (!upcomingEvents?.length && !!myUpcomingVisits?.upcoming) {
      setUpcomingEvents(myUpcomingVisits.upcoming)
    }
  }, [myUpcomingVisits])

  React.useEffect(() => {
    if (selected) {
      // if you removed the last item of this type
      if (myUpcomingVisits?.byType[selected?.type].length === 0) {
        resetView()
      } else {
        setUpcomingEvents(myUpcomingVisits?.byType[selected?.type])
      }
    }
  }, [myUpcomingVisits?.byType, date])

  const resetView = () => {
    setSelected(null)
    setUpcomingEvents(myUpcomingVisits.upcoming)
    onChooseCard(null, selected?.areaId ?? '', dayjs())
  }

  const processOnClick = (dailyEvent: DailyEventType) => {
    if (!dailyEvent) {
      return
    }
    setUpcomingEvents(myUpcomingVisits.byType[dailyEvent.type])
    setSelected(dailyEvent)
    setDate(dayjs(dailyEvent.date))
    onChooseCard(
      dailyEvent.deskId ?? '',
      dailyEvent.areaId ?? '',
      dayjs(dailyEvent.date)
    )
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

  const onEntityCancel = (
    id: string,
    type: string,
    value: string,
    date: string
  ) => {
    const confirmMessage = `Are you sure you want to cancel this ${type}: ${value} on ${dayjs(
      date
    ).format(FRIENDLY_DATE_FORMAT)}?`
    if (window.confirm(confirmMessage)) {
      const data: updateData = {
        id,
        status: 'cancelled',
      }
      updateFns[type](data)
      refetchVisits()
    }
  }

  return (
    <div className={className}>
      {!!selected ? (
        <div className="">
          <BackButton
            text="Back to List"
            className="mt-[-8px]"
            onClick={() => resetView()}
          />
        </div>
      ) : (
        <p className="mb-4 pb-2">
          <span className="text-text-tertiary">Location: </span>
          {office?.name}
        </p>
      )}
      <div className="flex justify-start gap-4 overflow-x-auto max-w-[980px]">
        {!!upcomingEvents?.length &&
          upcomingEvents.map((v: DailyEventType, index) => (
            <DailyEvent
              key={v?.id}
              dailyEvent={v}
              onClick={processOnClick}
              selected={selected?.id ?? null}
              onEntityCancel={onEntityCancel}
            />
          ))}
      </div>
    </div>
  )
}

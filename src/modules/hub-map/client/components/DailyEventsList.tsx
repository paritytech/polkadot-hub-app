import { BackButton, showNotification } from '#client/components/ui'
import { useOffice } from '#client/utils/hooks'
import { useUpdateVisit, useVisitsAreas } from '#modules/visits/client/queries'
import { useStore } from '@nanostores/react'
import dayjs, { Dayjs } from 'dayjs'
import React from 'react'
import * as stores from '#client/stores'
import { useUpdateRoomReservationByUser } from '#modules/room-reservation/client/queries'
import { useUpdateGuestInviteByUser } from '#modules/guest-invites/client/queries'
import {
  DailyEventType,
  GenericVisit,
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
  setOfficeVisits: (v: Array<GenericVisit>) => void
  setDate: (d: any) => void
  date: any
}> = ({ onChooseCard, setOfficeVisits, setDate, date }) => {
  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId)
  const [upcomingEvents, setUpcomingEvents] = React.useState([])
  const [selected, setSelected] = React.useState<any | null>(null)

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

  const { data: upcoming, refetch: refetchVisits } = useOfficeVisitsUpcoming(
    officeId,
    dayjs().toString()
  )

  React.useEffect(() => {
    if (!upcomingEvents.length && !!upcoming?.upcoming) {
      setUpcomingEvents(upcoming.upcoming)
    }
  }, [upcoming])

  React.useEffect(() => {
    if (!!upcoming?.byDate) {
      setOfficeVisits(upcoming.byDate[date.format('YYYY-MM-DD')])
    }
  }, [upcoming?.byDate, date])

  const resetOfficeVisits = React.useCallback(() => {
    setOfficeVisits(upcoming.byDate[dayjs().format('YYYY-MM-DD')] ?? [])
  }, [upcoming?.byDate])

  const processOnClick = (dailyEvent: DailyEventType) => {
    if (!dailyEvent) {
      return
    }
    console.log('daily ', dailyEvent)
    setUpcomingEvents(upcoming.byType[dailyEvent.type])
    setSelected(dailyEvent)
    setDate(dayjs(dailyEvent.date))
    onChooseCard(
      dailyEvent.deskId ?? '',
      dailyEvent.areaId ?? '',
      dayjs(dailyEvent.date)
    )

    if (!!upcoming.byDate) {
      setOfficeVisits(upcoming.byDate[dailyEvent.date])
    }
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
    }
  }

  // console.log('selected ', selected)
  return (
    <div>
      {!!selected ? (
        <div className="">
          <BackButton
            text="Back to List"
            className="mt-[-8px]"
            onClick={() => {
              setSelected(null)
              setUpcomingEvents(upcoming.upcoming)
              onChooseCard(null, selected.areaId, dayjs())
              resetOfficeVisits()
            }}
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
              eventId={index}
              dailyEvent={v}
              onClick={processOnClick}
              selected={selected}
              onEntityCancel={onEntityCancel}
            />
          ))}
      </div>
    </div>
  )
}

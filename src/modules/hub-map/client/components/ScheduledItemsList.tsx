import { BackButton, Icons, showNotification } from '#client/components/ui'
import { useOffice } from '#client/utils/hooks'
import { useUpdateVisit } from '#modules/visits/client/queries'
import { useStore } from '@nanostores/react'
import dayjs, { Dayjs } from 'dayjs'
import React from 'react'
import * as stores from '#client/stores'
import { useUpdateRoomReservationByUser } from '#modules/room-reservation/client/queries'
import { useUpdateGuestInviteByUser } from '#modules/guest-invites/client/queries'
import {
  GuestInviteStatus,
  RoomReservationStatus,
  VisitStatus,
  VisitType,
} from '#shared/types'
import { FRIENDLY_DATE_FORMAT } from '#client/constants'
import { ScheduledItem } from './ScheduledItem'
import { useUpcoming } from '../queries'
import { ScheduledItemType } from '#modules/hub-map/types'

export const ScheduledItemsList: React.FC<{
  onChooseCard: (id: string | null, areaId: string | null, date: Dayjs) => void
  setDate: (d: Dayjs) => void
  date: Dayjs
  className?: string
}> = ({ onChooseCard, setDate, date, className }) => {
  const officeId = useStore(stores.officeId)
  const [scheduledItems, setScheduledItems] = React.useState([])
  const [selected, setSelected] = React.useState<ScheduledItemType | null>(null)

  const cancellationCallback = () => {
    showNotification(`Successfully cancelled.`, 'success')
    refetchUpcoming()
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

  const { data: myUpcomingScheduledItems, refetch: refetchUpcoming } =
    useUpcoming(officeId, dayjs().toString(), me?.id)

  React.useEffect(() => {
    if (!!myUpcomingScheduledItems?.upcoming) {
      setScheduledItems(myUpcomingScheduledItems.upcoming)
    }
  }, [myUpcomingScheduledItems])

  React.useEffect(() => {
    if (selected) {
      // if you removed the last item of this type
      if (myUpcomingScheduledItems?.byType[selected?.type].length === 0) {
        resetView()
      } else {
        setScheduledItems(myUpcomingScheduledItems?.byType[selected?.type])
      }
    }
  }, [myUpcomingScheduledItems?.byType, date])

  const resetView = () => {
    setSelected(null)
    setScheduledItems(myUpcomingScheduledItems.upcoming)
    onChooseCard(null, selected?.areaId ?? '', dayjs())
  }

  const processOnClick = (scheduledItem: ScheduledItemType) => {
    if (!scheduledItem) {
      return
    }
    setScheduledItems(myUpcomingScheduledItems.byType[scheduledItem.type])
    setSelected(scheduledItem)
    setDate(dayjs(scheduledItem.date))
    onChooseCard(
      scheduledItem.objectId ?? '',
      scheduledItem.areaId ?? '',
      dayjs(scheduledItem.date)
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
    date: string,
    dates?: string[]
  ) => {
    let confirmMessage = ''
    if (type === VisitType.Guest && !!dates && dates?.length > 1) {
      const otherDates = dates
        ?.map((d) => dayjs(d).format(FRIENDLY_DATE_FORMAT))
        .join('\n\n')
      confirmMessage = `By cancelling this guest invite for ${value}, you will cancel the invite for these OTHER DATES as well:\n\n${otherDates}`
    } else {
      confirmMessage = `Are you sure you want to cancel this ${type}: ${value} on ${dayjs(
        date
      ).format(FRIENDLY_DATE_FORMAT)}?`
    }
    if (window.confirm(confirmMessage)) {
      const data: updateData = {
        id,
        status: 'cancelled',
      }
      updateFns[type](data)
      setSelected(null)
      refetchUpcoming()
    }
  }

  return (
    <div className={className}>
      {!!selected && (
        <div className="">
          <BackButton
            text="Back to List"
            className="block sm:hidden mt-[-8px]"
            onClick={() => resetView()}
          />
        </div>
      )}
      <div className="flex justify-start flex-col sm:flex-row gap-2 sm:gap-4 overflow-x-auto max-w-[980px]">
        {!!selected && (
          <div onClick={() => resetView()}>
            <div className="hidden sm:block">
              <Icons.ArrowBack height="24" width="24" />
            </div>
          </div>
        )}
        {!!scheduledItems?.length &&
          scheduledItems.map((item: ScheduledItemType) => (
            <ScheduledItem
              key={item?.id + item.value + item.date}
              sheduledItem={item}
              onClick={processOnClick}
              selected={selected?.id ?? null}
              onEntityCancel={onEntityCancel}
            />
          ))}
      </div>
    </div>
  )
}

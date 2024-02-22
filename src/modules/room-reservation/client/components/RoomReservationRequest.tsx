import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import dayjsDuration from 'dayjs/plugin/duration'
import React, { useEffect, useState } from 'react'
import {
  ComponentWrapper,
  H1,
  Icons,
  P,
  TabSlider,
  showNotification,
} from '#client/components/ui'
import { DATE_FORMAT } from '#client/constants'
import * as stores from '#client/stores'
import {
  RoomBookingModes,
  RoomBookingTabHeaders,
  RoomReservationRequest as RoomReservationRequestType,
} from '#shared/types'
import { cn } from '#client/utils'
import { renderMarkdown } from '#client/utils/markdown'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import Permissions from '#shared/permissions'
import { RoomListing } from './RoomListing'
import { TimeSlotsListing } from './TimeSlotsListing'
import { MeetingRoomBookingModal } from './MeetingRoomBookingModal'
import { formatDayOfTheWeekWithDate, formatTimeLeft } from '../helpers'
import {
  useAvailableRoomsForTimeSlot,
  useAvailableTimeRanges,
  useAvailableTimeSlotsForRoom,
  useCreateRoomReservation,
  usePlaceholderMessage,
  useRooms,
} from '../queries'

dayjs.extend(dayjsDuration)

export const RoomReservationRequest = () => {
  const officeId = useStore(stores.officeId)
  return (
    <PermissionsValidator
      officeId={officeId}
      required={[Permissions['room-reservation'].Create]}
      onRejectGoHome
    >
      <_RoomReservationRequest />
    </PermissionsValidator>
  )
}

const _RoomReservationRequest: React.FC = () => {
  const officeId = useStore(stores.officeId)
  const [showModal, setShowModal] = useState(false)
  const roomRefs = React.useRef<Record<string, HTMLDivElement>>({})
  const [timeDuration, setTimeDuration] = useState(
    dayjs.duration(30, 'minutes')
  )
  const [request, setRequest] = React.useState<RoomReservationRequestType>({
    userIds: [],
    roomId: '',
    date: dayjs().format(DATE_FORMAT),
    timeSlot: '',
  })

  React.useEffect(() => {
    const url = new URL(document.location.href)
    const room = url.searchParams.get('roomId')
    const date = url.searchParams.get('date')
    if (!!room && !!date) {
      setMode(RoomBookingModes.SpecificRoom)
      setRequest({
        ...request,
        roomId: room,
        date: date,
      })
      if (room) {
        history.pushState(
          '',
          document.title,
          window.location.pathname + window.location.search
        )
        setTimeout(scrollToRoom, 500, room)
      }
    }
  }, [])

  const scrollToRoom = React.useCallback((roomId: string) => {
    const selected = roomRefs.current[roomId]
    if (selected) {
      window.scrollTo({
        top: selected.offsetTop - 200,
        behavior: 'smooth',
      })
    }
  }, [])

  const [mode, setMode] = useState(RoomBookingModes.AnyRoom)
  const [timeSlots, setTimeSlots] = useState<Array<string>>([])
  const { data: placeholderMessage } = usePlaceholderMessage(officeId)
  const { data: slots } = useAvailableTimeRanges(
    officeId,
    timeDuration.asMinutes(),
    request.date
  )

  useEffect(() => {
    if (!!slots) {
      setTimeSlots(slots)
    }
  }, [slots])

  const { data: rooms = [] } = useRooms(officeId)
  const { data: availableRooms } = useAvailableRoomsForTimeSlot(
    request.timeSlot,
    officeId,
    request.date
  )
  const { data: timeSlotsForRoom = [] } = useAvailableTimeSlotsForRoom(
    officeId,
    request.roomId,
    timeDuration.asMinutes(),
    request.date
  )
  const { mutate: createRoomReservation } = useCreateRoomReservation(
    officeId,
    () => {
      stores.goTo('home')
      showNotification(`Meeting room was successfully booked`, 'success')
    }
  )

  useEffect(() => {
    setShowModal(!!request.roomId && !!request.timeSlot)
  }, [request.roomId, request.timeSlot])

  const handleModeClick = (mode: string) => {
    setMode(mode)
    setRequest((v) => ({ ...v, roomId: '', timeSlot: '' }))
  }

  const updateRequest = (field: string, value: string) =>
    setRequest((v) => ({ ...v, [field]: value }))

  const add30Minutes = () => {
    if (timeDuration.asHours() < 8) {
      setTimeDuration(timeDuration.add(30, 'minutes'))
      updateRequest('timeSlot', '')
    }
  }

  const subtract30Minutes = () => {
    if (timeDuration.asMinutes() > 30) {
      setTimeDuration(timeDuration.subtract(30, 'minutes'))
      updateRequest('timeSlot', '')
    }
  }

  const timeLeft = React.useMemo(
    () => formatTimeLeft(timeDuration.asSeconds()),
    [timeDuration]
  )
  const tabContent = {
    [RoomBookingModes.AnyRoom]: (
      <>
        <SelectSlot
          timeDuration={timeDuration}
          areAvailableSlots={!!timeSlots?.length}
          selected={!!request.timeSlot}
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          <TimeSlotsListing
            slots={timeSlots}
            chosenTimeSlot={request.timeSlot}
            handleChoosingTimeSlot={(timeSlot: string) =>
              updateRequest('timeSlot', timeSlot)
            }
          />
          {request.timeSlot && !!availableRooms && (
            <RoomListing
              rooms={availableRooms}
              buttonTitle="Book room"
              title={`Meeting Rooms Available for ${timeLeft.value} ${timeLeft.term} meeting`}
              onRoomSelect={(roomId: string) => updateRequest('roomId', roomId)}
            />
          )}
        </div>
      </>
    ),

    [RoomBookingModes.SpecificRoom]: (
      <RoomListing
        chosenRoom={request.roomId}
        rooms={rooms}
        buttonTitle="Select room"
        onRoomSelect={(roomId: string) => updateRequest('roomId', roomId)}
      >
        <div
          className="mt-4"
          ref={(el) => {
            if (el && roomRefs?.current) {
              roomRefs.current[request.roomId] = el
            }
          }}
        >
          <SelectSlot
            timeDuration={timeDuration}
            areAvailableSlots={!!timeSlots?.length}
            selected={!!request.timeSlot}
          />
          <TimeSlotsListing
            slots={timeSlotsForRoom}
            chosenTimeSlot={request.timeSlot}
            handleChoosingTimeSlot={(timeSlot: string) =>
              updateRequest('timeSlot', timeSlot)
            }
          />
        </div>
      </RoomListing>
    ),
  }

  const inputStyle = 'h-[56px] w-full bg-fill-6 rounded-md border-none'

  if (!!placeholderMessage) {
    return (
      <ComponentWrapper className="p-4 sm:p-6">
        <H1 className="font-extra text-center mt-4 mb-8">Book Meeting Room</H1>
        {!!placeholderMessage && (
          <div
            className="phq_markdown-content text-gray-800"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(placeholderMessage),
            }}
          />
        )}
      </ComponentWrapper>
    )
  }

  const modalOnClose = () => {
    if (mode === RoomBookingModes.AnyRoom) {
      updateRequest('roomId', '')
    } else {
      updateRequest('timeSlot', '')
    }
  }

  const options = {
    roomDetails: rooms?.find((r) => r.id === request.roomId),
    timeSlot: request.timeSlot,
    date: request.date,
    onConfirm: () => createRoomReservation(request),
  }
  const formattedDate = formatDayOfTheWeekWithDate(request.date)
  return (
    <ComponentWrapper className="p-4 sm:p-6">
      {showModal && (
        <MeetingRoomBookingModal
          title="Confirm Meeting Room Booking"
          options={options}
          onClose={modalOnClose}
          onConfirm={() => createRoomReservation(request)}
        />
      )}
      <H1 className="font-extra text-center">Book Meeting Room</H1>
      {!!placeholderMessage && (
        <div
          className="phq_markdown-content text-gray-800"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(placeholderMessage),
          }}
        />
      )}
      <div className="px-2">
        <div className="flex flex-col md:flex-row justify-between gap-2 sm:gap-4 mb-6 sm:mb-4">
          <div className="w-full relative">
            <P className="text-text-tertiary">Select day</P>
            <div className={cn('relative', inputStyle)}>
              <div className="flex justify-between items-center h-full">
                <P className="pl-[20px]">
                  <span className="font-bold">{formattedDate.day}, </span>
                  {formattedDate.date}
                </P>
                <Icons.Calendar className="h-6 w-6 mr-4 " />
              </div>
              <input
                className="hidden-input border-1 w-full absolute bottom-0 left-0 h-full opacity-0"
                value={dayjs(request.date).format(DATE_FORMAT)}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
                  setRequest((v) => ({
                    ...v,
                    date: dayjs(ev.target.value.toString()).format(DATE_FORMAT),
                  }))
                }
                placeholder=""
                type="date"
                name="reservationDate"
              />
            </div>
          </div>
          <div className="w-full">
            <P className="text-text-tertiary">Set Meeting Duration</P>
            <div className={cn(inputStyle, 'p-4 flex justify-between')}>
              <Icons.MinusButton
                onClick={subtract30Minutes}
                fillClassName={cn(
                  timeDuration.asMinutes() === 30
                    ? 'stroke-slate-400'
                    : `stroke-accents-pink`
                )}
                className={cn(
                  timeDuration.asMinutes() === 30
                    ? 'hover:cursor-default'
                    : `hover:cursor-pointer`
                )}
              />

              <div className="font-medium">
                {formatTimeLeft(timeDuration.asSeconds()).value}{' '}
                {formatTimeLeft(timeDuration.asSeconds()).term}
              </div>
              <Icons.PlusButton
                onClick={add30Minutes}
                fillClassName={cn(
                  timeDuration.asHours() === 8
                    ? 'stroke-slate-400'
                    : `stroke-accents-pink`
                )}
                className={cn(
                  timeDuration.asHours() === 8
                    ? 'hover:cursor-default'
                    : `hover:cursor-pointer`
                )}
              />
            </div>
          </div>
        </div>
        {!!rooms && (
          <TabSlider
            tabs={RoomBookingModes}
            headers={RoomBookingTabHeaders}
            content={tabContent}
            onClick={handleModeClick}
            chosenTab={mode}
          />
        )}
      </div>
    </ComponentWrapper>
  )
}

const SelectSlot: React.FC<{
  timeDuration: dayjsDuration.Duration
  areAvailableSlots: boolean
  selected: boolean
}> = ({ timeDuration, areAvailableSlots, selected }) => {
  if (selected) {
    return <P className="text-text-tertiary">Time Slot Selected</P>
  }
  const durationValue = formatTimeLeft(timeDuration.asSeconds())
  return (
    <P className="text-text-tertiary">
      {areAvailableSlots
        ? `Select time slot available for ${durationValue.value} ${durationValue.term} meeting`
        : `No time slots are available for an ${durationValue.value} ${durationValue.term} meeting`}
    </P>
  )
}

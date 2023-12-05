import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import {
  Counter,
  FButton,
  H1,
  Icons,
  Modal,
  P,
  ProgressBar,
  RoundButton,
  Panel,
} from '#client/components/ui'
import {
  getDifference,
  getTimeLeft,
  getCurrentMeeting,
  getRoomObject,
  roundToNearestHalfHour,
  formatTimeLeft,
  timeUntilNearestHalfHour,
  TEMP_MEETING_ID,
  isWithinWorkingHours,
} from '../helpers'
import { cn } from '#client/utils'
import { NextMeetings } from './NextMeetings'
import { RoomDisplayData, RoomReservation } from '#shared/types'
import {
  useCreateRoomReservationTablet,
  useUpdateReservationDuration,
} from '../queries'

const COUNTDOWN_VALUE = 5
const TIME_STEP = 30
const MINUTE = 1000 * 60

type ModalProps = {
  onConfirm: () => void
  onCancel: () => void
}
export const ConfirmationModal: React.FC<ModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal onClose={onCancel}>
      <div className="flex flex-col gap-4">
        <H1 className="text-center text-[40px] mb-10">Are you sure?</H1>
        <FButton onClick={onConfirm} className="w-full text-lg rounded-sm">
          Yes, end the meeting
        </FButton>
        <FButton
          onClick={onCancel}
          kind="secondary"
          className="w-full text-lg rounded-sm"
        >
          Cancel
        </FButton>
      </div>
    </Modal>
  )
}

export const DeviceRoomReservation: React.FC<{ display: RoomDisplayData }> = ({
  display,
}) => {
  const [timeDuration, setTimeDuration] = useState(
    timeUntilNearestHalfHour(TIME_STEP)
  )
  const [currentMeeting, setCurrentMeeting] = useState<RoomReservation | null>(
    null
  )
  const [showModal, setShowModal] = useState(false)
  const [bookingInProgress, setBookingInProgress] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_VALUE)
  const [meetingCountdownSeconds, setMeetingCountdownSeconds] = useState(0)
  const [nextMeeting, setNextMeeting] = useState<RoomReservation | null>(null)
  const [isNowWithinWorkingHours, setIsNowWithinWorkingHours] = useState(
    isWithinWorkingHours(dayjs().toString(), display.workingHours)
  )

  const { mutate: updateReservationDuration } = useUpdateReservationDuration(
    () => ''
  )
  const { mutate: createRoomReservation } = useCreateRoomReservationTablet(
    display?.office!,
    () => {}
  )

  useEffect(() => {
    const timer = setInterval(() => {
      let newDuration = timeUntilNearestHalfHour(TIME_STEP).minutes()
      if (timeDuration.asMinutes() > 30) {
        newDuration += (timeDuration.minutes() / 30) * 30
      }
      setTimeDuration(dayjs.duration(newDuration, 'minutes'))
    }, MINUTE)
    return () => {
      clearInterval(timer)
    }
  }, [])

  const addTimeStep = () => {
    if (nextMeeting?.startDate) {
      const dateTimePlusStep = dayjs()
        .add(timeDuration)
        .add(TIME_STEP, 'minutes')
        .second(0)
        .millisecond(0)
      const nextMeetingStartDateTime = dayjs(nextMeeting?.startDate)
      if (
        (dateTimePlusStep.isBefore(nextMeetingStartDateTime) ||
          dateTimePlusStep.isSame(nextMeetingStartDateTime)) &&
        timeDuration.asHours() < 8
      ) {
        setTimeDuration(timeDuration.add(TIME_STEP, 'minutes'))
      }
    } else if (timeDuration.asHours() < 8) {
      setTimeDuration(timeDuration.add(TIME_STEP, 'minutes'))
    }
  }

  const subtractTimeStep = () => {
    if (timeDuration.asMinutes() > TIME_STEP) {
      setTimeDuration(timeDuration.subtract(TIME_STEP, 'minutes'))
    }
  }

  const handleMeetingIsOver = () => {
    if (display.current) {
      updateReservationDuration({ reservationId: display.current?.id })
      setCurrentMeeting(null)
      setShowModal(false)
    }
  }

  useEffect(() => {
    if (bookingInProgress) {
      const timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1)
      }, 1000)
      return () => {
        clearInterval(timer)
      }
    }
  }, [bookingInProgress])

  useEffect(() => {
    const interval = setInterval(() => {
      if (display.timezone) {
        setIsNowWithinWorkingHours(
          isWithinWorkingHours(
            dayjs().tz(display.timezone).toString(),
            display.workingHours
          )
        )
      }
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    setCurrentMeeting(display.current)
    if (!display.current && !currentMeeting?.id == !TEMP_MEETING_ID) {
      setMeetingCountdownSeconds(0)
    }
    if (display.current) {
      setMeetingCountdownSeconds(
        getTimeLeft(display.current?.startDate, display.current?.endDate)
      )
    }
  }, [display.current])

  useEffect(() => {
    if (display.upcoming && display.upcoming[0]) {
      setNextMeeting(display.upcoming[0])
    }
  }, [display.upcoming])

  useEffect(() => {
    if (countdown === 0) {
      setBookingInProgress(false)
      const startDate = dayjs().toDate()
      const endDate = roundToNearestHalfHour(dayjs().add(timeDuration)).toDate()
      if (display.timezone && display.roomId && display.office) {
        createRoomReservation(getRoomObject(display, startDate, endDate))
        setMeetingCountdownSeconds(getDifference(startDate, endDate, 'seconds'))
        setCurrentMeeting(
          getCurrentMeeting(display.office, display.roomId, startDate, endDate)
        )
      }
      setCountdown(COUNTDOWN_VALUE)
    }
  }, [countdown])

  if (!display) {
    return <></>
  }

  let timeLeft = formatTimeLeft(timeDuration.asSeconds())

  return (
    <div
      className="h-screen p-4"
      style={{ height: '100vh', position: 'relative' }}
    >
      <div className="grid grid-cols-2 gap-x-4 h-full">
        {showModal && (
          <ConfirmationModal
            onConfirm={handleMeetingIsOver}
            onCancel={() => setShowModal(false)}
          />
        )}
        {!!currentMeeting && !!currentMeeting.id && (
          <Panel
            title={display.roomName}
            topBannerColor="bg-accents-pink"
            topBannerTextColor="text-white"
            mainAreaColor="bg-accents-redLight"
            className="p-2"
          >
            <div className="grid grid-rows-[1fr_auto_1fr] h-full p-6 pt-4">
              <P className="text-xxl text-center ">
                <span className="text-accents-red font-extra leading-[56px] capitalize font-extrabold">
                  Occupied
                </span>
              </P>
              {meetingCountdownSeconds && currentMeeting && (
                <Counter
                  countDownTime={meetingCountdownSeconds}
                  totalDuration={getDifference(
                    currentMeeting?.startDate,
                    currentMeeting?.endDate
                  )}
                />
              )}{' '}
              <FButton
                onClick={() => setShowModal(true)}
                className={cn(
                  'w-full rounded-sm bg-accents-redTransparent hover:bg-accents-redTransparent text-accents-redMediumTransparent text-[24px] font-bold font-extra capitalize h-fit self-end',
                  'disabled:bg-slate-300'
                )}
              >
                The Meeting is Over
              </FButton>
            </div>
          </Panel>
        )}

        {!isNowWithinWorkingHours && (
          <Panel
            title={display.roomName ?? ''}
            topBannerColor="bg-accents-pink"
            topBannerTextColor="text-white"
            className="p-2"
          >
            <div className="flex items-center justify-center h-full">
              <H1 className="text-text-tertiary leading-10">
                Meeting room is closed now.
                <br /> Working hours: {display.workingHours?.join(' - ')}
              </H1>
            </div>
          </Panel>
        )}

        {!bookingInProgress && !currentMeeting?.id && isNowWithinWorkingHours && (
          <Panel
            title={display.roomName ?? ''}
            topBannerColor="bg-accents-pink"
            topBannerTextColor="text-white"
            mainAreaColor="bg-green-100"
            className="p-2"
          >
            <div className="grid grid-rows-[1fr_auto_1fr] h-full p-6 pt-4">
              <P className="text-lg md:text-xxl text-center ">
                <span className="text-accents-green font-extra  leading-5md:leading-[56px] capitalize font-extrabold">
                  Book Room for the Next
                </span>
              </P>
              <div className="flex flex-row justify-between items-center">
                <div className="h-[50px] w-[50px]  md:h-[80px] md:w-[80px] ">
                  <RoundButton
                    icon='SimpleArrowButton'
                    onClick={subtractTimeStep}
                    className="h-full w-full bg-transparent border-accents-green border-2 p-0 hover:bg-transparent focus:outline-none focus:ring-0"
                  ></RoundButton>
                </div>
                <div className="text-center text-accents-green">
                  <div className="font-medium font-extra text-xl md:text-[64px] leading-[64px]">
                    {timeLeft.value}
                  </div>
                  <P className="text-md md:text-[20px] text-center font-bold uppercase leading-8 mt-0">
                    {timeLeft.term}
                  </P>
                </div>
                <div className="h-[50px] w-[50px]  md:h-[80px] md:w-[80px] ">
                  <RoundButton
                    icon='SimpleArrowButton'
                    onClick={() =>
                      timeDuration.asMinutes() === 0 ? '' : addTimeStep()
                    }
                    className="fill h-full w-full scale-x-[-1] bg-transparent border-accents-green border-2 p-0 hover:bg-transparent focus:outline-none focus:ring-0"
                  ></RoundButton>
                </div>
              </div>
              <FButton
                onClick={() => setBookingInProgress(true)}
                className={cn(
                  'w-full rounded-sm bg-accents-greenLight hover:bg-accents-greenLight text-[20px] font-bold font-extra capitalize h-fit self-end',
                  'disabled:bg-slate-300'
                )}
                disabled={
                  timeDuration.asMinutes() === 0 || !isNowWithinWorkingHours
                }
              >
                Book
              </FButton>
            </div>
          </Panel>
        )}
        {!!bookingInProgress && (
          <Panel
            title={display.roomName}
            topBannerColor={cn('bg-accents-pink')}
            topBannerTextColor={cn('text-white')}
            className="p-2"
          >
            <div className="grid grid-rows-[1fr_auto_1fr] h-full p-6 pt-4">
              <P className="text-xxl text-center ">
                <span className="text-text-tertiary font-extra leading-[56px] capitalize font-extrabold">
                  Room will be booked in
                </span>
              </P>
              <div className="font-medium font-extra text-[64px] leading-[64px] text-text-secondary text-center">
                {countdown}
              </div>
              <ProgressBar
                progress={100 - (100 * countdown) / COUNTDOWN_VALUE}
                className="mt-10"
              />
              <FButton
                onClick={() => setBookingInProgress(false)}
                className="w-full rounded-sm bg-fill-4 hover:bg-fill-4 text-[20px] text-text-secondary font-bold font-extra uppercase h-fit self-end"
              >
                Cancel
              </FButton>
            </div>
          </Panel>
        )}
        <NextMeetings display={display} />
      </div>
    </div>
  )
}

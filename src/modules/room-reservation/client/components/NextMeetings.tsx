import React from 'react'
import { H1, H2, HR, P, Panel } from '#client/components/ui'
import { RoomDisplayData, RoomReservation } from '#shared/types'
import { formatTime } from '../helpers'
import { cn } from '#client/utils'
import { Island, PanelWrapper, TopBanner } from '#client/components/ui/Panel'

const Meeting: React.FC<{
  meeting: RoomReservation
  index: number
  timezone: string | null
  creatorFullName: string
  current?: boolean
  wrapperClassName?: string
}> = ({
  meeting,
  index,
  timezone,
  creatorFullName,
  current,
  wrapperClassName,
}) => (
  <div>
    {!!index && <HR />}
    <div className={cn('flex gap-4 flex-col mt-6 mb-6', wrapperClassName)}>
      <P
        className={cn(
          current ? 'text-black' : 'text-text-secondary',
          'font-extra text-lg m-0'
        )}
      >
        {timezone && formatTime(meeting.startDate, timezone ?? '')} -{' '}
        {timezone && formatTime(meeting.endDate, timezone ?? '')}
      </P>
      <div
        className={cn(
          'rounded-md font-medium text-base border  w-fit px-4 py-2',
          current ? 'text-black' : 'text-text-tertiary',
          current ? 'border-black' : 'border-applied-stroke'
        )}
      >
        {creatorFullName}
      </div>
    </div>
  </div>
)

export const NextMeetings: React.FC<{ display: RoomDisplayData }> = ({
  display,
}) => {
  return (
    <PanelWrapper>
      <TopBanner title="Meetings" />
      <div className="overflow-hidden h-full grid grid-rows-5 gap-2">
        {!!display.current && (
          <Island className="p-2 h-full row-span-2">
            <div className="">
              <H2 className="mt-6 mb-0">Current meeting</H2>
              <Meeting
                meeting={display.current}
                index={0}
                timezone={display.timezone}
                current
                wrapperClassName={'mb-0'}
                creatorFullName={
                  !!display.current.creatorUserId &&
                  !!display.usersById[display.current.creatorUserId]
                    ? display.usersById[display.current.creatorUserId ?? '']
                        .fullName
                    : ''
                }
              />
            </div>
          </Island>
        )}
        <Island
          className={cn(
            'p-2 overflow-y-scroll flex-grow',
            !display.current ? 'row-span-full' : 'row-span-3'
          )}
        >
          {!!display?.upcoming.length && (
            <div className="">
              <H2 className="mt-6 text-text-secondary">Next meetings</H2>
              {display?.upcoming.map((meeting, meetingIndex) => (
                <Meeting
                  key={meeting.id}
                  meeting={meeting}
                  index={meetingIndex}
                  timezone={display.timezone}
                  creatorFullName={
                    !!meeting.creatorUserId &&
                    !!display.usersById[meeting.creatorUserId]
                      ? display.usersById[meeting.creatorUserId ?? ''].fullName
                      : ''
                  }
                />
              ))}
            </div>
          )}

          {!display?.upcoming.length && (
            <div className="flex items-center justify-center h-full">
              <H1 className="text-text-tertiary">No Upcoming Meetings</H1>
            </div>
          )}
        </Island>
      </div>
    </PanelWrapper>
  )
}

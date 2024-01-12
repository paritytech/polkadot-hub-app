import React from 'react'
import { cn } from '#client/utils'
import { DailyEventType, VisitType } from '#shared/types'
import dayjs from 'dayjs'
import { FButton, P } from '#client/components/ui'

export const BGColors: Record<string, string> = {
  [VisitType.RoomReservation]: 'bg-[#F0FAF4]',
  [VisitType.Visit]: 'bg-cta-hover-purpleNoOpacity',
  [VisitType.Guest]: 'bg-cta-hover-ceruleanNoOpacity',
}

export const BGColorSelect: Record<string, string> = {
  [VisitType.RoomReservation]: 'border-[#AFEEC8]',
  [VisitType.Visit]: 'border-[#C4B8E5]',
  [VisitType.Guest]: 'border-cta-hover-ceruleanNoOpacity',
}

// export const BGColorSelect: Record<string, string> = {
//   [VisitType.RoomReservation]: 'bg-[#E5F7EC]',
//   [VisitType.Visit]: 'bg-[#F0EBFD]',
//   [VisitType.Guest]: 'bg-cta-hover-ceruleanNoOpacity',
// }

export const BGColorsHover: Record<string, string> = {
  [VisitType.RoomReservation]: `hover:border-[#AFEEC8]`,
  [VisitType.Visit]: `hover:border-[#C4B8E5]`,
  [VisitType.Guest]: `hover:border-cta-ceruleanNoOpacity`,
}

// export const BGColorsHover: Record<string, string> = {
//   [VisitType.RoomReservation]: `hover:${
//     BGColorSelect[VisitType.RoomReservation]
//   }`,
//   [VisitType.Visit]: `hover:${BGColorSelect[VisitType.Visit]}`,
//   [VisitType.Guest]: `hover:${BGColorSelect[VisitType.Guest]}`,
// }

export const OfficeVisitsHeaders = {
  [VisitType.Visit]: 'Desks',
  [VisitType.Guest]: 'Guest Visits',
  [VisitType.RoomReservation]: 'Rooms',
} as const

// @todo fix type
export const StatusColor: Record<string, string> = {
  confirmed: 'bg-green-500',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  rejected: 'bg-red-500',
}

const DateHeader = ({ dateValue }: { dateValue: string | Date }) => (
  <P textType="additional" className="mt-0 mb-0">
    <span className="text-accents-red">
      {dayjs(dateValue).isToday() ? `Today` : dayjs(dateValue).format('dddd')}
      {' · '}
    </span>
    <span className="text-text-secondary">
      {dayjs(dateValue).format('D MMMM')}
    </span>
  </P>
)

export const DailyEvent = ({
  dailyEvent,
  selected,
  onClick,
  eventId,
  onEntityCancel,
}: {
  dailyEvent: DailyEventType
  selected: string | null
  onClick: (item: any) => void
  eventId: number
  onEntityCancel: (
    id: string,
    type: string,
    value: string,
    date: string
  ) => void
}) => {
  const iAmSelected = selected == dailyEvent.id
  return (
    <div className="animate-fade-in-left" title={dailyEvent.status}>
      <div
        onClick={() => onClick(dailyEvent)}
        className={cn(
          'transition-all',
          'w-[224px] min-w-[224px] h-[192px] min-h-[192px] flex flex-col justify-between rounded-sm py-4 px-6 cursor-pointer',
          BGColors[dailyEvent.type],
          'border border-transparent',
          iAmSelected && BGColorSelect[dailyEvent.type],
          BGColorsHover[dailyEvent.type] && `${BGColorsHover[dailyEvent.type]}`
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden">
            <DateHeader dateValue={dailyEvent.date} />
            <div className="flex justify-between items-center mt-2">
              <p className={cn('capitalize', iAmSelected && 'font-bold')}>
                {dailyEvent.value}
              </p>
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  StatusColor[dailyEvent.status]
                )}
              ></div>
            </div>
            <p className="text-text-secondary text-sm">
              {dailyEvent.dateTime ? dailyEvent.dateTime : ''}
            </p>
            <p className="text-text-tertiary text-sm break-all">
              {dailyEvent.description}
            </p>
          </div>
        </div>
        {selected && (
          <FButton
            kind="secondary"
            size="small"
            className="w-full mt-2"
            onClick={() =>
              onEntityCancel(
                dailyEvent.id,
                dailyEvent.type,
                dailyEvent.value,
                dailyEvent.date
              )
            }
          >
            Cancel
          </FButton>
        )}
      </div>
    </div>
  )
}

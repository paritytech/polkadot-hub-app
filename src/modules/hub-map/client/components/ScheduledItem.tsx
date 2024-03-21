import React from 'react'
import { cn } from '#client/utils'
import { VisitType } from '#shared/types'
import dayjs from 'dayjs'
import { FButton, P } from '#client/components/ui'
import { ScheduledItemType } from '#modules/hub-map/types'

export const PageUrls: Record<string, string> = {
  event: '/events',
}

const ColorsBg: Record<string, string> = {
  [VisitType.RoomReservation]: 'bg-cta-hover-jade',
  [VisitType.Visit]: 'bg-cta-hover-purple',
  [VisitType.Guest]: 'bg-cta-hover-cerulean',
  event: 'bg-gray-50',
}

const ColorsBorder: Record<string, string> = {
  [VisitType.RoomReservation]: 'border-cta-jade',
  [VisitType.Visit]: 'border-cta-purple',
  [VisitType.Guest]: 'border-cta-cerulean',
  event: 'border-gray-300',
}

const ColorsHover: Record<string, string> = {
  [VisitType.RoomReservation]: 'hover:border-cta-jade',
  [VisitType.Visit]: 'hover:border-cta-purple',
  [VisitType.Guest]: 'hover:border-cta-cerulean',
  event: 'hover:border-gray-300',
}

const StatusColor: Record<string, string> = {
  confirmed: 'bg-green-500',
  pending: 'bg-yellow-500',
  opened: 'bg-yellow-500',
  cancelled: 'bg-red-500',
}

const DateHeader = ({ dateValue }: { dateValue: string | Date }) => {
  const date = dayjs(dateValue).isToday()
    ? `Today`
    : dayjs(dateValue).format('dddd')
  return (
    <P textType="additional" className="mt-0 mb-0">
      <span
        className={cn(
          date === 'Today' ? 'text-accents-red' : 'text-text-secondary'
        )}
      >
        {date}
        {' · '}
      </span>
      <span className="text-text-secondary">
        {dayjs(dateValue).format('D MMMM')}
      </span>
    </P>
  )
}

const Status = ({ status }: { status: string }) => (
  <div className={cn('h-2 w-2 rounded-full ', StatusColor[status])}> </div>
)

export const ScheduledItem = ({
  sheduledItem,
  selected,
  onClick,
  onEntityCancel,
}: {
  sheduledItem: ScheduledItemType
  selected: string | null
  onClick: (item: ScheduledItemType) => void
  onEntityCancel: (
    id: string,
    type: string,
    value: string,
    date: string,
    dates?: string[]
  ) => void
}) => {
  const iAmSelected = selected == sheduledItem.id
  return (
    <div className="animate-fade-in-left" title={sheduledItem.status}>
      <div
        onClick={() => {
          if (!!PageUrls[sheduledItem.type]) {
            window.location.href = PageUrls[sheduledItem.type]
          } else {
            onClick(sheduledItem)
          }
        }}
        className={cn(
          'transition-all',
          ' w-full sm:w-[224px] sm:h-[192px]  flex flex-col justify-between rounded-sm px-4 py-4 sm:px-6 cursor-pointer',
          ColorsBg[sheduledItem.type],
          'border border-transparent',
          iAmSelected && ColorsBorder[sheduledItem.type],
          ColorsHover[sheduledItem.type] && `${ColorsHover[sheduledItem.type]}`
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden">
            <div className="flex justify-between items-center">
              <DateHeader dateValue={sheduledItem.date} />
              {sheduledItem.status && <Status status={sheduledItem.status} />}
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className={cn('capitalize', iAmSelected && 'font-bold')}>
                {sheduledItem.value.slice(0, 16)}
                {sheduledItem.value.length > 16 && '...'}
                <span className="sm:hidden text-text-tertiary text-sm break-all">
                  {' '}
                  {sheduledItem.description}
                </span>
              </p>
            </div>
            <p className="text-text-secondary text-sm">
              {sheduledItem.extraInformation
                ? sheduledItem.extraInformation
                : ''}
            </p>
            <p className="hidden sm:block text-text-tertiary text-sm break-all">
              {sheduledItem.description}
            </p>
          </div>
        </div>
        {!!selected && (
          <FButton
            kind="secondary"
            size="small"
            className="w-full mt-2"
            onClick={() =>
              onEntityCancel(
                sheduledItem.id,
                sheduledItem.type,
                sheduledItem.value,
                sheduledItem.date,
                sheduledItem.dates
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

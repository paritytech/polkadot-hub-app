import React from 'react'
import dayjs from 'dayjs'
import { FButton, Tag, Warning } from '#client/components/ui'
import { Event } from '#shared/types'
import { cn } from '#client/utils'

const DATE_FORMAT = 'D MMM'

type Props = {
  event: Event
  className?: string
  withApplyButton?: boolean
  requiresAction?: boolean
}
export const EventBadge: React.FC<Props> = ({
  event,
  className = '',
  withApplyButton = false,
  requiresAction = false,
}) => {
  const url = React.useMemo(() => `/events/${event.id}`, [event])
  const now = dayjs()
  const [startDate, endDate] = [event.startDate, event.endDate].map(dayjs)
  const isToday = now >= startDate && now <= endDate
  const isSingleDay = startDate.isSame(endDate, 'day')
  return (
    <div className={cn('flex rounded-sm p-4', className)}>
      <a href={url} className="block mr-4">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={`${event.title} event's cover`}
            className="block rounded-tiny w-[72px] h-[72px] object-cover"
          />
        ) : (
          <div className="rounded-tiny w-[72px] h-[72px] bg-fill-6" />
        )}
      </a>
      <a href={url} className="flex-1 block">
        <div className="text-accents-red mb-1 text-sm">
          {isToday
            ? 'Today'
            : isSingleDay
            ? startDate.format(DATE_FORMAT)
            : `${startDate.format(DATE_FORMAT)} - ${endDate.format(
                DATE_FORMAT
              )}`}
        </div>
        <div>{event.title}</div>
      </a>
      {requiresAction && (
        <Tag color="red" className="h-fit">
          <p className="text-accents-pink">incomplete checklist</p>
        </Tag>
      )}
      {withApplyButton && (
        <div className="flex items-center ml-4">
          <FButton size="small" kind="secondary" href={url}>
            Apply
          </FButton>
        </div>
      )}
    </div>
  )
}
